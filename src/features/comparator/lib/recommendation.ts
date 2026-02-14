import { getModelById } from "@/lib/models";
import type { PredictionState } from "../store/comparator-store";

interface Preferences {
  quality: number; // 0-100
  cost: number; // 0-100
  speed: number; // 0-100
}

export interface Recommendation {
  modelId: string;
  score: number;
  breakdown: {
    quality: number;
    cost: number;
    speed: number;
  };
}

export function getRecommendation(
  predictions: Record<string, PredictionState>,
  preferences: Preferences
): Recommendation | null {
  const completedIds = Object.keys(predictions).filter(
    (id) => predictions[id].status === "succeeded"
  );

  if (completedIds.length === 0) return null;

  // Normalize weights
  const totalWeight = preferences.quality + preferences.cost + preferences.speed;
  if (totalWeight === 0) return null;
  const wQ = preferences.quality / totalWeight;
  const wC = preferences.cost / totalWeight;
  const wS = preferences.speed / totalWeight;

  // Gather data for normalization
  const models = completedIds.map((id) => {
    const model = getModelById(id);
    const pred = predictions[id];
    return {
      id,
      qualityScore: model?.qualityScore ?? 0.5,
      costPerToken: model?.costPerToken ?? 0.001,
      latencyMs: pred.metrics.predict_time ?? model?.avgLatencyMs ?? 5000,
    };
  });

  const maxCost = Math.max(...models.map((m) => m.costPerToken));
  const minCost = Math.min(...models.map((m) => m.costPerToken));
  const maxLatency = Math.max(...models.map((m) => m.latencyMs));
  const minLatency = Math.min(...models.map((m) => m.latencyMs));

  const scored: Recommendation[] = models.map((m) => {
    const qualityNorm = m.qualityScore; // Already 0-1

    // Cost: lower is better, so invert
    const costNorm =
      maxCost === minCost ? 1 : 1 - (m.costPerToken - minCost) / (maxCost - minCost);

    // Speed: lower latency is better, so invert
    const speedNorm =
      maxLatency === minLatency
        ? 1
        : 1 - (m.latencyMs - minLatency) / (maxLatency - minLatency);

    const score = wQ * qualityNorm + wC * costNorm + wS * speedNorm;

    return {
      modelId: m.id,
      score,
      breakdown: {
        quality: qualityNorm,
        cost: costNorm,
        speed: speedNorm,
      },
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}
