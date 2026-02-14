"use client";

import { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getModelById } from "@/lib/models";
import { useComparatorStore } from "../store/comparator-store";
import { getRecommendation } from "../lib/recommendation";

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </span>
        <span className="text-xs tabular-nums text-zinc-400">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-blue-500 dark:bg-zinc-700"
      />
    </div>
  );
}

export function RecommendationPanel() {
  const predictions = useComparatorStore((s) => s.predictions);
  const preferences = useComparatorStore((s) => s.preferences);
  const setPreference = useComparatorStore((s) => s.setPreference);
  const [copied, setCopied] = useState(false);

  const recommendation = getRecommendation(predictions, preferences);
  const model = recommendation ? getModelById(recommendation.modelId) : null;
  const output = recommendation
    ? predictions[recommendation.modelId]?.output
    : null;

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hasResults = Object.values(predictions).some(
    (p) => p.status === "succeeded"
  );

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        <Sparkles size={14} />
        Recommendation
      </h3>

      <div className="space-y-3">
        <Slider
          label="Quality"
          value={preferences.quality}
          onChange={(v) => setPreference("quality", v)}
        />
        <Slider
          label="Cost Efficiency"
          value={preferences.cost}
          onChange={(v) => setPreference("cost", v)}
        />
        <Slider
          label="Speed"
          value={preferences.speed}
          onChange={(v) => setPreference("speed", v)}
        />
      </div>

      {hasResults && recommendation && model && (
        <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                {model.displayName}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Score: {(recommendation.score * 100).toFixed(0)}% match
              </p>
            </div>
            {output && (
              <button
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  copied
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-800/50 dark:text-blue-300"
                )}
              >
                {copied ? (
                  <>
                    <Check size={12} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy Output
                  </>
                )}
              </button>
            )}
          </div>
          <p className="mt-1 text-[10px] text-blue-500/70 dark:text-blue-400/50">
            Based on model metadata estimates
          </p>
        </div>
      )}

      {hasResults && !recommendation && (
        <p className="mt-3 text-xs text-zinc-400">
          Adjust sliders to see a recommendation.
        </p>
      )}
    </div>
  );
}
