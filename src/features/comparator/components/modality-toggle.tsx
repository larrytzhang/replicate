"use client";

import { Type, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useComparatorStore } from "../store/comparator-store";
import { cancelComparison } from "../lib/prediction-runner";
import type { Modality } from "@/lib/models";

const modes: { value: Modality; label: string; icon: typeof Type }[] = [
  { value: "text", label: "Text", icon: Type },
  { value: "image", label: "Image", icon: ImageIcon },
];

export function ModalityToggle() {
  const modality = useComparatorStore((s) => s.modality);
  const isRunning = useComparatorStore((s) => s.isRunning);
  const setModality = useComparatorStore((s) => s.setModality);

  function handleSwitch(value: Modality) {
    if (value === modality) return;
    if (isRunning) cancelComparison();
    setModality(value);
  }

  return (
    <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
      {modes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => handleSwitch(value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            modality === value
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          )}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
