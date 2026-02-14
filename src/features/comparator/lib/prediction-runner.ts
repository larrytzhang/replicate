import { nanoid } from "nanoid";
import { getModelById } from "@/lib/models";
import { getTextStream, getImagePrediction } from "@/lib/prediction-provider";
import { useComparatorStore } from "../store/comparator-store";

// AbortControllers scoped per runId
const abortControllers = new Map<string, AbortController[]>();

function getStore() {
  return useComparatorStore.getState();
}

export async function runComparison() {
  const { selectedModelIds, prompt, modality, isRunning, predictionMode } = getStore();

  if (isRunning) {
    cancelComparison();
    // Small delay to let cancel propagate
    await new Promise((r) => setTimeout(r, 50));
  }

  if (selectedModelIds.length < 2 || !prompt.trim()) return;

  const runId = nanoid();
  const store = getStore();
  store.startRun(runId, selectedModelIds);

  const controllers: AbortController[] = [];
  abortControllers.set(runId, controllers);

  const promises = selectedModelIds.map(async (modelId) => {
    const controller = new AbortController();
    controllers.push(controller);
    const { signal } = controller;
    const model = getModelById(modelId);
    if (!model) return;

    const startTime = Date.now();

    try {
      getStore().setPredictionStatus(modelId, "processing", runId);

      if (modality === "text") {
        const stream = getTextStream(predictionMode, modelId, prompt, signal);
        for await (const event of stream) {
          if (signal.aborted) return;
          if (event.type === "token") {
            getStore().appendToken(modelId, event.data, runId);
          } else if (event.type === "error") {
            getStore().setPredictionError(modelId, event.data, runId);
            return;
          }
        }
        const elapsed = Date.now() - startTime;
        getStore().setPredictionResult(
          modelId,
          {
            status: "succeeded",
            output: null, // already built via appendToken
            costUsd: model.costPerRun,
            predictTime: elapsed,
          },
          runId
        );
      } else {
        // Image mode
        const result = await getImagePrediction(predictionMode, modelId, prompt, signal);
        const elapsed = Date.now() - startTime;
        if (result.status === "failed") {
          getStore().setPredictionError(
            modelId,
            result.error ?? "Unknown error",
            runId
          );
        } else {
          getStore().setPredictionResult(
            modelId,
            {
              status: "succeeded",
              output: result.output,
              costUsd: result.cost,
              predictTime: elapsed,
            },
            runId
          );
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        getStore().setPredictionStatus(modelId, "canceled", runId);
      } else {
        getStore().setPredictionError(
          modelId,
          err instanceof Error ? err.message : "Unknown error",
          runId
        );
      }
    }
  });

  await Promise.allSettled(promises);

  // Cleanup
  abortControllers.delete(runId);

  // Only finish if this run is still current
  if (getStore().currentRunId === runId) {
    getStore().finishRun();
  }
}

export function cancelComparison() {
  const { currentRunId } = getStore();
  if (!currentRunId) return;

  const controllers = abortControllers.get(currentRunId);
  if (controllers) {
    for (const ctrl of controllers) {
      ctrl.abort();
    }
    abortControllers.delete(currentRunId);
  }

  // Mark all in-progress predictions as canceled
  const { predictions } = getStore();
  for (const modelId of Object.keys(predictions)) {
    const pred = predictions[modelId];
    if (pred.status === "starting" || pred.status === "processing") {
      getStore().setPredictionStatus(modelId, "canceled", currentRunId);
    }
  }

  getStore().finishRun();
}
