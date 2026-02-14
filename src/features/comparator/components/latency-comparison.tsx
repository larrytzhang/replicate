"use client";

import { Timer } from "lucide-react";
import { formatLatency } from "@/lib/utils";
import { getModelById } from "@/lib/models";
import { useComparatorStore } from "../store/comparator-store";

export function LatencyComparison() {
  const predictions = useComparatorStore((s) => s.predictions);
  const entries = Object.values(predictions);

  const completed = entries.filter(
    (p) => p.status === "succeeded" && p.metrics.predict_time
  );
  if (completed.length === 0) return null;

  const maxLatency = Math.max(...completed.map((p) => p.metrics.predict_time ?? 0));

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        <Timer size={14} />
        Latency Comparison
      </h3>
      <div className="space-y-3">
        {completed
          .sort((a, b) => (a.metrics.predict_time ?? 0) - (b.metrics.predict_time ?? 0))
          .map((pred) => {
            const model = getModelById(pred.modelId);
            const latency = pred.metrics.predict_time ?? 0;
            const pct = maxLatency > 0 ? (latency / maxLatency) * 100 : 0;

            return (
              <div key={pred.modelId}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {model?.displayName ?? pred.modelId}
                  </span>
                  <span className="font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {formatLatency(latency)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
