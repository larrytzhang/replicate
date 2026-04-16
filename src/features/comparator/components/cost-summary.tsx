"use client";

import { DollarSign, TrendingDown } from "lucide-react";
import { formatCost } from "@/lib/utils";
import { getModelById } from "@/lib/models";
import { useComparatorStore } from "../store/comparator-store";

export function CostSummary() {
  const predictions = useComparatorStore((s) => s.predictions);
  const entries = Object.values(predictions);

  const completed = entries.filter((p) => p.status === "succeeded" && p.costUsd !== null);
  if (completed.length === 0) return null;

  const totalCost = completed.reduce((sum, p) => sum + (p.costUsd ?? 0), 0);

  const sortedByCost = [...completed].sort(
    (a, b) => (a.costUsd ?? 0) - (b.costUsd ?? 0)
  );
  const cheapest = sortedByCost[0];
  const priciest = sortedByCost[sortedByCost.length - 1];
  const cheapCost = cheapest.costUsd ?? 0;
  const priceyCost = priciest.costUsd ?? 0;
  const showSavings =
    completed.length >= 2 && priceyCost > cheapCost && cheapCost > 0;
  const savingsPct = showSavings
    ? ((priceyCost - cheapCost) / priceyCost) * 100
    : 0;
  const savingsDollar = priceyCost - cheapCost;
  const cheapModel = getModelById(cheapest.modelId);
  const priceyModel = getModelById(priciest.modelId);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        <DollarSign size={14} />
        Cost Breakdown
      </h3>
      <div className="space-y-2">
        {completed.map((pred) => {
          const model = getModelById(pred.modelId);
          return (
            <div key={pred.modelId} className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                {model?.displayName ?? pred.modelId}
              </span>
              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                {formatCost(pred.costUsd ?? 0)}
              </span>
            </div>
          );
        })}
        <div className="mt-2 flex items-center justify-between border-t border-zinc-200 pt-2 dark:border-zinc-700">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Total
          </span>
          <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
            {formatCost(totalCost)}
          </span>
        </div>
      </div>
      {showSavings && (
        <div className="mt-3 flex items-start gap-1.5 rounded-md bg-green-50 px-2.5 py-2 text-xs text-green-700 ring-1 ring-inset ring-green-600/10 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-400/20">
          <TrendingDown size={14} className="mt-0.5 shrink-0" />
          <span>
            Save <strong>{savingsPct.toFixed(0)}%</strong> ({formatCost(savingsDollar)}) by
            choosing{" "}
            <strong>{cheapModel?.displayName ?? cheapest.modelId}</strong> over{" "}
            <strong>{priceyModel?.displayName ?? priciest.modelId}</strong>.
          </span>
        </div>
      )}
    </div>
  );
}
