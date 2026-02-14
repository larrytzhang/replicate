import {
  demoTextStream,
  demoImagePrediction,
  type StreamEvent,
  type PredictionResult,
} from "./demo-client";
import {
  replicateTextStream,
  replicateImagePrediction,
} from "./replicate-client";

export type PredictionMode = "demo" | "replicate";

export function getTextStream(
  mode: PredictionMode,
  modelId: string,
  prompt: string,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  if (mode === "demo") return demoTextStream(modelId, prompt, signal);
  return replicateTextStream(modelId, prompt, signal);
}

export function getImagePrediction(
  mode: PredictionMode,
  modelId: string,
  prompt: string,
  signal?: AbortSignal
): Promise<PredictionResult> {
  if (mode === "demo") return demoImagePrediction(modelId, prompt, signal);
  return replicateImagePrediction(modelId, prompt, signal);
}
