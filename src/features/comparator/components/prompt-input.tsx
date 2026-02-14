"use client";

import { Play, Square } from "lucide-react";
import { cn, formatCost } from "@/lib/utils";
import { getModelById } from "@/lib/models";
import { getPresets, type Preset } from "@/lib/demo-presets";
import { useComparatorStore } from "../store/comparator-store";
import { runComparison, cancelComparison } from "../lib/prediction-runner";

function calculateEstimatedCost(modelIds: string[], prompt: string): number {
  const estimatedTokens = Math.max(prompt.length / 4, 10);
  return modelIds.reduce((total, id) => {
    const model = getModelById(id);
    if (!model) return total;
    return total + (model.modality === "image" ? model.costPerRun : model.costPerToken * estimatedTokens);
  }, 0);
}

function PresetButtons() {
  const modality = useComparatorStore((s) => s.modality);
  const selectedModelIds = useComparatorStore((s) => s.selectedModelIds);
  const isRunning = useComparatorStore((s) => s.isRunning);
  const setPrompt = useComparatorStore((s) => s.setPrompt);

  const presets = getPresets(modality);
  const canRun = selectedModelIds.length >= 2;

  const handlePresetClick = (preset: Preset) => {
    if (!canRun || isRunning) return;
    setPrompt(preset.prompt);
    runComparison();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Choose a preset prompt
      </label>
      
      {!canRun && (
        <p className="text-xs text-zinc-400">Select at least 2 models to run.</p>
      )}
      
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {presets.map((preset) => (
          <button
            key={preset.prompt}
            onClick={() => handlePresetClick(preset)}
            disabled={!canRun || isRunning}
            title={preset.prompt}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              canRun && !isRunning
                ? "border-zinc-200 bg-white text-zinc-800 hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-500 dark:hover:bg-blue-950/30"
                : "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-500"
            )}
          >
            <span className="font-medium">{preset.label}</span>
            <span className="mt-0.5 block text-xs text-zinc-400 dark:text-zinc-500">
              {preset.category}
            </span>
          </button>
        ))}
      </div>

      {isRunning && (
        <div className="flex justify-end mt-4">
          <button
            onClick={cancelComparison}
            className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            <Square size={14} /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function LivePromptInput() {
  const prompt = useComparatorStore((s) => s.prompt);
  const setPrompt = useComparatorStore((s) => s.setPrompt);
  const isRunning = useComparatorStore((s) => s.isRunning);
  const selectedModelIds = useComparatorStore((s) => s.selectedModelIds);

  const canRun = selectedModelIds.length >= 2 && prompt.trim().length > 0;
  const estimatedCost = canRun ? calculateEstimatedCost(selectedModelIds, prompt) : 0;

  const handleRun = () => {
    if (isRunning) cancelComparison();
    else if (canRun) runComparison();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (canRun && !isRunning) runComparison();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Prompt
      </label>
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your prompt here... (Cmd/Ctrl + Enter to run)"
        rows={3}
        className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-400">
          {canRun ? (
            <span>
              Estimated cost: <span className="font-medium text-zinc-600 dark:text-zinc-300">{formatCost(estimatedCost)}</span>
              {" "}for {selectedModelIds.length} models
            </span>
          ) : (
            <span>
              {selectedModelIds.length < 2 
                ? "Select at least 2 models" 
                : "Enter a prompt to run"}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!isRunning && (
            <span className="hidden text-xs text-zinc-400 sm:inline-block">
              Cmd/Ctrl + Enter to run
            </span>
          )}
          <button
            onClick={handleRun}
            disabled={!canRun && !isRunning}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
              isRunning
                ? "bg-red-500 hover:bg-red-600"
                : canRun
                  ? "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  : "cursor-not-allowed bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-500"
            )}
          >
            {isRunning ? (
              <><Square size={14} /> Cancel</>
            ) : (
              <><Play size={14} /> Run</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PromptInput() {
  const predictionMode = useComparatorStore((s) => s.predictionMode);
  return predictionMode === "demo" ? <PresetButtons /> : <LivePromptInput />;
}