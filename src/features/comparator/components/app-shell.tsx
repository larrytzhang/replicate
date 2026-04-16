"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { PredictionMode } from "@/lib/prediction-provider";
import { ModalityToggle } from "./modality-toggle";
import { ModelSelector } from "./model-selector";
import { PromptInput } from "./prompt-input";
import { ComparisonGrid } from "./comparison-grid";
import { CostSummary } from "./cost-summary";
import { LatencyComparison } from "./latency-comparison";
import { RecommendationPanel } from "./recommendation-panel";
import { SessionControls } from "./session-controls";
import { Footer } from "./footer";
import { useComparatorStore } from "../store/comparator-store";
import { parseUrlParams } from "../lib/session";

function ModeBadge({ mode }: { mode: PredictionMode }) {
  const isDemo = mode === "demo";
  return (
    <span
      className={cn(
        "mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        isDemo
          ? "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-400/20"
          : "bg-green-50 text-green-700 ring-green-600/10 dark:bg-green-950/50 dark:text-green-300 dark:ring-green-400/20"
      )}
    >
      {isDemo
        ? "Demo Mode — preset prompts with cached predictions"
        : "Live Mode — real Replicate API predictions"}
    </span>
  );
}

function ModeToggle({ liveAvailable }: { liveAvailable: boolean }) {
  // ✅ GOOD: Subscribing to properties individually prevents infinite re-renders
  const predictionMode = useComparatorStore((s) => s.predictionMode);
  const setPredictionMode = useComparatorStore((s) => s.setPredictionMode);
  const isRunning = useComparatorStore((s) => s.isRunning);
  const reset = useComparatorStore((s) => s.reset);

  if (!liveAvailable) return null;

  const handleSwitch = (mode: PredictionMode) => {
    if (mode === predictionMode || isRunning) return;
    reset();
    setPredictionMode(mode);
  };

  const modes: Array<{ id: PredictionMode; label: string }> = [
    { id: "demo", label: "Demo" },
    { id: "replicate", label: "Live" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
      {modes.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => handleSwitch(id)}
          disabled={isRunning}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            predictionMode === id
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
            isRunning && "cursor-not-allowed opacity-50"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function AppShell() {
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const predictions = useComparatorStore((s) => s.predictions);
  const predictionMode = useComparatorStore((s) => s.predictionMode);
  
  const hasResults = Object.values(predictions).some((p) => p.status === "succeeded");

  useEffect(() => {
    let mounted = true;

    async function initializeApp() {
      try {
        const res = await fetch("/api/config");
        if (!res.ok) throw new Error("Config fetch failed");
        const data = await res.json();
        
        if (!mounted) return;
        setLiveAvailable(data.liveAvailable);
        
        const store = useComparatorStore.getState();
        store.setPredictionMode(data.defaultMode);

        const params = parseUrlParams();
        if (params) {
          if (params.modality) store.setModality(params.modality);
          
          if (params.selectedModelIds) {
            const currentIds = [...store.selectedModelIds];
            currentIds.forEach(id => {
              if (!params.selectedModelIds!.includes(id)) store.toggleModel(id);
            });
            params.selectedModelIds.forEach(id => {
              if (!store.selectedModelIds.includes(id)) store.toggleModel(id);
            });
          }
          
          if (params.prompt) store.setPrompt(params.prompt);
          if (params.preferences) {
            store.setPreference("quality", params.preferences.quality);
            store.setPreference("cost", params.preferences.cost);
            store.setPreference("speed", params.preferences.speed);
          }

          window.history.replaceState({}, "", window.location.pathname);
        }
      } catch (error) {
        console.warn("App initialization gracefully fell back to defaults.");
      } finally {
        if (mounted) setIsInitialized(true);
      }
    }

    initializeApp();

    return () => {
      mounted = false;
    };
  }, []);

  if (!isInitialized) return null;

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Model Comparator
            </h1>
            <ModeToggle liveAvailable={liveAvailable} />
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Compare AI models side-by-side with real-time streaming output
          </p>
          <ModeBadge mode={predictionMode} />
        </div>
        <SessionControls />
      </div>

      <div className="mb-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <ModalityToggle />
        </div>
        <ModelSelector />
        <PromptInput />
      </div>

      <ComparisonGrid />

      {hasResults && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <CostSummary />
          <LatencyComparison />
          <RecommendationPanel />
        </div>
      )}

      <Footer />
    </div>
  );
}