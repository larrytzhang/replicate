import { create } from "zustand";
import type { Modality } from "@/lib/models";
import type { PredictionMode } from "@/lib/prediction-provider";

export type PredictionStatus =
  | "starting"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

export interface PredictionState {
  id: string;
  modelId: string;
  status: PredictionStatus;
  output: string | null;
  logs: string;
  metrics: { predict_time?: number };
  costUsd: number | null;
  error: string | null;
  startedAt: number;
}

export interface ComparatorState {
  modality: Modality;
  predictionMode: PredictionMode;
  selectedModelIds: string[];
  prompt: string;
  isRunning: boolean;
  currentRunId: string | null;
  predictions: Record<string, PredictionState>;
  preferences: { quality: number; cost: number; speed: number };

  // Pure actions
  setPredictionMode: (mode: PredictionMode) => void;
  setModality: (modality: Modality) => void;
  toggleModel: (modelId: string) => void;
  setPrompt: (prompt: string) => void;
  setPreference: (key: "quality" | "cost" | "speed", value: number) => void;
  setPredictionStatus: (
    modelId: string,
    status: PredictionStatus,
    runId: string
  ) => void;
  appendToken: (modelId: string, token: string, runId: string) => void;
  setPredictionResult: (
    modelId: string,
    result: {
      status: PredictionStatus;
      output: string | null;
      costUsd: number | null;
      predictTime: number;
    },
    runId: string
  ) => void;
  setPredictionError: (
    modelId: string,
    error: string,
    runId: string
  ) => void;
  startRun: (runId: string, modelIds: string[]) => void;
  finishRun: () => void;
  reset: () => void;
}

export const useComparatorStore = create<ComparatorState>((set, get) => ({
  modality: "text",
  predictionMode: "demo",
  selectedModelIds: [],
  prompt: "",
  isRunning: false,
  currentRunId: null,
  predictions: {},
  preferences: { quality: 50, cost: 50, speed: 50 },

  setPredictionMode: (mode) => set({ predictionMode: mode }),

  setModality: (modality) =>
    set({ modality, selectedModelIds: [], predictions: {} }),

  toggleModel: (modelId) =>
    set((state) => {
      const selected = state.selectedModelIds;
      if (selected.includes(modelId)) {
        return { selectedModelIds: selected.filter((id) => id !== modelId) };
      }
      if (selected.length >= 4) return state;
      return { selectedModelIds: [...selected, modelId] };
    }),

  setPrompt: (prompt) => set({ prompt }),

  setPreference: (key, value) =>
    set((state) => ({
      preferences: { ...state.preferences, [key]: value },
    })),

  setPredictionStatus: (modelId, status, runId) =>
    set((state) => {
      if (state.currentRunId !== runId) return state;
      const pred = state.predictions[modelId];
      if (!pred) return state;
      return {
        predictions: {
          ...state.predictions,
          [modelId]: { ...pred, status },
        },
      };
    }),

  appendToken: (modelId, token, runId) =>
    set((state) => {
      if (state.currentRunId !== runId) return state;
      const pred = state.predictions[modelId];
      if (!pred) return state;
      return {
        predictions: {
          ...state.predictions,
          [modelId]: {
            ...pred,
            output: (pred.output ?? "") + token,
          },
        },
      };
    }),

  setPredictionResult: (modelId, result, runId) =>
    set((state) => {
      if (state.currentRunId !== runId) return state;
      const pred = state.predictions[modelId];
      if (!pred) return state;
      return {
        predictions: {
          ...state.predictions,
          [modelId]: {
            ...pred,
            status: result.status,
            output: result.output ?? pred.output,
            costUsd: result.costUsd,
            metrics: { predict_time: result.predictTime },
          },
        },
      };
    }),

  setPredictionError: (modelId, error, runId) =>
    set((state) => {
      if (state.currentRunId !== runId) return state;
      const pred = state.predictions[modelId];
      if (!pred) return state;
      return {
        predictions: {
          ...state.predictions,
          [modelId]: {
            ...pred,
            status: "failed",
            error,
          },
        },
      };
    }),

  startRun: (runId, modelIds) => {
    const predictions: Record<string, PredictionState> = {};
    for (const modelId of modelIds) {
      predictions[modelId] = {
        id: `pred_${Date.now()}_${modelId}`,
        modelId,
        status: "starting",
        output: null,
        logs: "",
        metrics: {},
        costUsd: null,
        error: null,
        startedAt: Date.now(),
      };
    }
    set({ isRunning: true, currentRunId: runId, predictions });
  },

  finishRun: () => set({ isRunning: false }),

  reset: () =>
    set({
      predictions: {},
      isRunning: false,
      currentRunId: null,
    }),
}));
