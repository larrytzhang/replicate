"use client";

import { cn } from "@/lib/utils";
import { useComparatorStore } from "../store/comparator-store";
import { OutputPanel } from "./output-panel";

export function ComparisonGrid() {
  const predictions = useComparatorStore((s) => s.predictions);
  const entries = Object.values(predictions);

  if (entries.length === 0) return null;

  const count = entries.length;

  return (
    <div
      className={cn(
        "grid gap-4",
        count === 2 && "grid-cols-1 md:grid-cols-2",
        count === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        count === 4 && "grid-cols-1 md:grid-cols-2"
      )}
    >
      {entries.map((pred) => (
        <OutputPanel key={pred.modelId} prediction={pred} />
      ))}
    </div>
  );
}
