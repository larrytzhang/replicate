"use client";

import { cn } from "@/lib/utils";
import { getModelsByModality } from "@/lib/models";
import { useComparatorStore } from "../store/comparator-store";

export function ModelSelector() {
  const modality = useComparatorStore((s) => s.modality);
  const selectedModelIds = useComparatorStore((s) => s.selectedModelIds);
  const toggleModel = useComparatorStore((s) => s.toggleModel);

  const models = getModelsByModality(modality);
  const atMax = selectedModelIds.length >= 4;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Select Models ({selectedModelIds.length}/4)
        </label>
        {selectedModelIds.length < 2 && (
          <span className="text-xs text-zinc-400">Pick at least 2</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {models.map((model) => {
          const selected = selectedModelIds.includes(model.id);
          const disabled = !selected && atMax;
          return (
            <button
              key={model.id}
              onClick={() => !disabled && toggleModel(model.id)}
              disabled={disabled}
              title={model.description}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                selected
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300"
                  : disabled
                    ? "cursor-not-allowed border-zinc-200 text-zinc-300 dark:border-zinc-700 dark:text-zinc-600"
                    : "border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
              )}
            >
              {model.displayName}
              <span className="ml-1.5 text-xs opacity-60">{model.provider}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
