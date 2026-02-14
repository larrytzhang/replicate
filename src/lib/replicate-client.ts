import { getModelById } from "./models";
import type { StreamEvent, PredictionResult } from "./demo-client";

export async function* replicateTextStream(
  modelId: string,
  prompt: string,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const model = getModelById(modelId);
  if (!model) throw new Error(`Unknown model: ${modelId}`);

  const response = await fetch("/api/predictions/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelName: model.name, prompt }),
    signal,
  });

  if (!response.ok || !response.body) {
    yield { type: "error", data: `API error: ${response.status}` };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(trimmed.slice(6)) as StreamEvent;
        yield event;
        if (event.type === "done" || event.type === "error") return;
      } catch {
        // skip malformed SSE lines
      }
    }
  }
}

export async function replicateImagePrediction(
  modelId: string,
  prompt: string,
  signal?: AbortSignal
): Promise<PredictionResult> {
  const model = getModelById(modelId);
  if (!model) throw new Error(`Unknown model: ${modelId}`);

  const startTime = Date.now();

  const response = await fetch("/api/predictions/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelName: model.name, prompt }),
    signal,
  });

  if (!response.ok) {
    return {
      id: `pred_${Date.now()}_${modelId}`,
      status: "failed",
      output: "",
      latencyMs: Date.now() - startTime,
      cost: 0,
      error: `API error: ${response.status}`,
    };
  }

  const data = (await response.json()) as {
    status: "succeeded" | "failed";
    output: string;
    latencyMs: number;
    error?: string;
  };

  return {
    id: `pred_${Date.now()}_${modelId}`,
    status: data.status,
    output: data.output,
    latencyMs: data.latencyMs,
    cost: model.costPerRun,
    error: data.error,
  };
}
