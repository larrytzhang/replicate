import { describe, it, expect } from "vitest";
import { getRecommendation } from "./recommendation";
import type { PredictionState, PredictionStatus } from "../store/comparator-store";

type MakePredictionInput = {
  modelId: string;
  status: PredictionStatus;
  predictTime?: number;
};

function makePrediction({
  modelId,
  status,
  predictTime,
}: MakePredictionInput): PredictionState {
  return {
    id: `pred_${modelId}`,
    modelId,
    status,
    output: null,
    logs: "",
    metrics: predictTime !== undefined ? { predict_time: predictTime } : {},
    costUsd: null,
    error: null,
    startedAt: 0,
    ttftMs: null,
  };
}

describe("getRecommendation", () => {
  const evenWeights = { quality: 50, cost: 50, speed: 50 };

  it("returns null when there are no predictions", () => {
    expect(getRecommendation({}, evenWeights)).toBeNull();
  });

  it("returns null when every prediction failed", () => {
    const predictions = {
      "llama-3-8b": makePrediction({ modelId: "llama-3-8b", status: "failed" }),
      "llama-3-70b": makePrediction({ modelId: "llama-3-70b", status: "failed" }),
    };
    expect(getRecommendation(predictions, evenWeights)).toBeNull();
  });

  it("returns null when total preference weight is zero", () => {
    const predictions = {
      "llama-3-8b": makePrediction({ modelId: "llama-3-8b", status: "succeeded" }),
    };
    const result = getRecommendation(predictions, { quality: 0, cost: 0, speed: 0 });
    expect(result).toBeNull();
  });

  it("ignores non-succeeded predictions", () => {
    const predictions = {
      "llama-3-8b": makePrediction({ modelId: "llama-3-8b", status: "succeeded" }),
      "llama-3-70b": makePrediction({ modelId: "llama-3-70b", status: "failed" }),
      "llama-3.1-405b": makePrediction({ modelId: "llama-3.1-405b", status: "canceled" }),
    };
    const result = getRecommendation(predictions, evenWeights);
    expect(result?.modelId).toBe("llama-3-8b");
  });

  it("picks the highest-quality model when weights prioritize quality", () => {
    const predictions = {
      "llama-3-8b": makePrediction({
        modelId: "llama-3-8b",
        status: "succeeded",
        predictTime: 1000,
      }),
      "llama-3.1-405b": makePrediction({
        modelId: "llama-3.1-405b",
        status: "succeeded",
        predictTime: 1000,
      }),
    };
    const result = getRecommendation(predictions, { quality: 100, cost: 0, speed: 0 });
    expect(result?.modelId).toBe("llama-3.1-405b");
  });

  it("picks the cheapest model when weights prioritize cost", () => {
    const predictions = {
      "llama-3-8b": makePrediction({
        modelId: "llama-3-8b",
        status: "succeeded",
        predictTime: 1000,
      }),
      "llama-3.1-405b": makePrediction({
        modelId: "llama-3.1-405b",
        status: "succeeded",
        predictTime: 1000,
      }),
    };
    const result = getRecommendation(predictions, { quality: 0, cost: 100, speed: 0 });
    expect(result?.modelId).toBe("llama-3-8b");
  });

  it("picks the fastest model when weights prioritize speed", () => {
    const predictions = {
      "llama-3-8b": makePrediction({
        modelId: "llama-3-8b",
        status: "succeeded",
        predictTime: 500,
      }),
      "llama-3-70b": makePrediction({
        modelId: "llama-3-70b",
        status: "succeeded",
        predictTime: 5000,
      }),
    };
    const result = getRecommendation(predictions, { quality: 0, cost: 0, speed: 100 });
    expect(result?.modelId).toBe("llama-3-8b");
  });

  it("uses measured predict_time over the model's static avgLatencyMs", () => {
    const predictions = {
      "llama-3-8b": makePrediction({
        modelId: "llama-3-8b",
        status: "succeeded",
        predictTime: 10_000,
      }),
      "llama-3-70b": makePrediction({
        modelId: "llama-3-70b",
        status: "succeeded",
        predictTime: 100,
      }),
    };
    const result = getRecommendation(predictions, { quality: 0, cost: 0, speed: 100 });
    expect(result?.modelId).toBe("llama-3-70b");
  });

  it("avoids divide-by-zero when only one model has succeeded", () => {
    const predictions = {
      "llama-3-8b": makePrediction({
        modelId: "llama-3-8b",
        status: "succeeded",
        predictTime: 1000,
      }),
    };
    const result = getRecommendation(predictions, evenWeights);
    expect(result).not.toBeNull();
    expect(result?.breakdown.cost).toBe(1);
    expect(result?.breakdown.speed).toBe(1);
  });

  it("produces breakdown and score values in the [0, 1] range", () => {
    const predictions = {
      "llama-3-8b": makePrediction({
        modelId: "llama-3-8b",
        status: "succeeded",
        predictTime: 1000,
      }),
      "llama-3-70b": makePrediction({
        modelId: "llama-3-70b",
        status: "succeeded",
        predictTime: 5000,
      }),
      "llama-3.1-405b": makePrediction({
        modelId: "llama-3.1-405b",
        status: "succeeded",
        predictTime: 2000,
      }),
    };
    const result = getRecommendation(predictions, { quality: 33, cost: 33, speed: 34 });
    expect(result).not.toBeNull();
    for (const v of [result!.breakdown.quality, result!.breakdown.cost, result!.breakdown.speed, result!.score]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
