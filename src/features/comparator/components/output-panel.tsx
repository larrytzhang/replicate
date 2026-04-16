"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn, formatLatency } from "@/lib/utils";
import { getModelById } from "@/lib/models";
import type { PredictionState, PredictionStatus } from "../store/comparator-store";

function StatusBadge({ status }: { status: PredictionStatus }) {
  const config: Record<PredictionStatus, { icon: typeof Loader2; className: string; label: string }> = {
    starting: { icon: Loader2, className: "text-yellow-500", label: "Starting" },
    processing: { icon: Loader2, className: "text-blue-500", label: "Processing" },
    succeeded: { icon: CheckCircle2, className: "text-green-500", label: "Succeeded" },
    failed: { icon: AlertCircle, className: "text-red-500", label: "Failed" },
    canceled: { icon: XCircle, className: "text-zinc-400", label: "Canceled" },
  };
  const { icon: Icon, className, label } = config[status];
  const isSpinning = status === "starting" || status === "processing";

  return (
    <span className={cn("flex items-center gap-1 text-xs font-medium", className)}>
      <Icon size={12} className={isSpinning ? "animate-spin" : ""} />
      {label}
    </span>
  );
}

function ElapsedTime({ startedAt, status }: { startedAt: number; status: PredictionStatus }) {
  const [, setTick] = useState(0);
  const isActive = status === "starting" || status === "processing";

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, [isActive]);

  const elapsed = Date.now() - startedAt;
  return (
    <span className="flex items-center gap-1 text-xs text-zinc-400">
      <Clock size={10} />
      {formatLatency(elapsed)}
    </span>
  );
}

interface OutputPanelProps {
  prediction: PredictionState;
}

export function OutputPanel({ prediction }: OutputPanelProps) {
  const [tab, setTab] = useState<"output" | "json">("output");
  const model = getModelById(prediction.modelId);

  return (
    <div className="flex min-h-[200px] flex-col rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {model?.displayName ?? prediction.modelId}
          </h3>
          <span className="text-xs text-zinc-400">{model?.provider}</span>
        </div>
        <div className="flex items-center gap-2">
          <ElapsedTime startedAt={prediction.startedAt} status={prediction.status} />
          <StatusBadge status={prediction.status} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setTab("output")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors",
            tab === "output"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          Output
        </button>
        <button
          onClick={() => setTab("json")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors",
            tab === "json"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          Raw JSON
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {tab === "output" ? (
          <OutputContent prediction={prediction} />
        ) : (
          <pre className="whitespace-pre-wrap break-all font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {JSON.stringify(prediction, null, 2)}
          </pre>
        )}
      </div>

      {/* Footer stats */}
      {prediction.status === "succeeded" && prediction.metrics.predict_time && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 dark:border-zinc-700">
          {prediction.ttftMs !== null && (
            <span title="Time to first token">
              TTFT: {formatLatency(prediction.ttftMs)}
            </span>
          )}
          <span>Latency: {formatLatency(prediction.metrics.predict_time)}</span>
          {prediction.costUsd !== null && (
            <span>Cost: ${prediction.costUsd.toFixed(4)}</span>
          )}
        </div>
      )}
    </div>
  );
}

function OutputContent({ prediction }: { prediction: PredictionState }) {
  const model = getModelById(prediction.modelId);

  if (prediction.status === "failed") {
    return (
      <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        {prediction.error ?? "Unknown error"}
      </div>
    );
  }

  if (prediction.status === "canceled") {
    return (
      <p className="text-sm text-zinc-400">Prediction was canceled.</p>
    );
  }

  if (prediction.status === "starting") {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 size={14} className="animate-spin" />
        Starting model...
      </div>
    );
  }

  // Image output
  if (model?.modality === "image" && prediction.output) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={prediction.output}
        alt={`Output from ${model.displayName}`}
        className="max-h-[300px] rounded-md"
      />
    );
  }

  // Text output (streaming or complete)
  if (prediction.output) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
        {prediction.output}
        {prediction.status === "processing" && (
          <span className="inline-block h-4 w-1.5 animate-pulse bg-zinc-400 align-text-bottom" />
        )}
      </div>
    );
  }

  if (prediction.status === "processing") {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 size={14} className="animate-spin" />
        Generating...
      </div>
    );
  }

  return null;
}
