export type Modality = "text" | "image";

export interface Model {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  modality: Modality;
  description: string;
  costPerRun: number;
  avgLatencyMs: number;
  supportsStreaming: boolean;
  qualityScore: number; // 0-1, relative quality rating
  costPerToken: number; // USD per token (text) or per-run cost (image)
}

export const MODELS: Model[] = [
  // Text Generation Models
  {
    id: "llama-3-8b",
    name: "meta/meta-llama-3-8b-instruct",
    displayName: "Llama 3 8B Instruct",
    provider: "Meta",
    modality: "text",
    description: "Fast, efficient 8B parameter model great for most text tasks.",
    costPerRun: 0.0005,
    avgLatencyMs: 800,
    supportsStreaming: true,
    qualityScore: 0.65,
    costPerToken: 0.000001,
  },
  {
    id: "llama-3-70b",
    name: "meta/meta-llama-3-70b-instruct",
    displayName: "Llama 3 70B Instruct",
    provider: "Meta",
    modality: "text",
    description: "Powerful 70B parameter model for complex reasoning and generation.",
    costPerRun: 0.0032,
    avgLatencyMs: 4500,
    supportsStreaming: true,
    qualityScore: 0.92,
    costPerToken: 0.0000065,
  },
  {
    id: "llama-3.1-405b",
    name: "meta/meta-llama-3.1-405b-instruct",
    displayName: "Llama 3.1 405B Instruct",
    provider: "Meta",
    modality: "text",
    description: "Largest open-source model. Top-tier reasoning and generation.",
    costPerRun: 0.015,
    avgLatencyMs: 900,
    supportsStreaming: true,
    qualityScore: 0.97,
    costPerToken: 0.000032,
  },
  {
    id: "llama-2-13b",
    name: "meta/llama-2-13b-chat",
    displayName: "Llama 2 13B Chat",
    provider: "Meta",
    modality: "text",
    description: "Compact 13B chat model. Good balance of speed and quality.",
    costPerRun: 0.001,
    avgLatencyMs: 1800,
    supportsStreaming: false,
    qualityScore: 0.68,
    costPerToken: 0.000002,
  },
  {
    id: "gemma-7b",
    name: "google/gemma-7b-it",
    displayName: "Gemma 7B IT",
    provider: "Google",
    modality: "text",
    description: "Google's lightweight open model, instruction-tuned.",
    costPerRun: 0.0008,
    avgLatencyMs: 1200,
    supportsStreaming: false,
    qualityScore: 0.6,
    costPerToken: 0.0000016,
  },
  // Image Generation Models
  {
    id: "sdxl",
    name: "stability-ai/sdxl",
    displayName: "SDXL",
    provider: "Stability AI",
    modality: "image",
    description: "High quality 1024x1024 image generation. The industry standard.",
    costPerRun: 0.012,
    avgLatencyMs: 8500,
    supportsStreaming: false,
    qualityScore: 0.85,
    costPerToken: 0.012,
  },
  {
    id: "sdxl-lightning",
    name: "bytedance/sdxl-lightning-4step",
    displayName: "SDXL Lightning",
    provider: "ByteDance",
    modality: "image",
    description: "Distilled SDXL that generates in just 4 steps. Very fast.",
    costPerRun: 0.004,
    avgLatencyMs: 2200,
    supportsStreaming: false,
    qualityScore: 0.7,
    costPerToken: 0.004,
  },
  {
    id: "flux-schnell",
    name: "black-forest-labs/flux-schnell",
    displayName: "FLUX.1 Schnell",
    provider: "Black Forest Labs",
    modality: "image",
    description: "Fastest FLUX model. Great quality at incredible speed.",
    costPerRun: 0.003,
    avgLatencyMs: 1800,
    supportsStreaming: false,
    qualityScore: 0.78,
    costPerToken: 0.003,
  },
  {
    id: "flux-dev",
    name: "black-forest-labs/flux-dev",
    displayName: "FLUX.1 Dev",
    provider: "Black Forest Labs",
    modality: "image",
    description: "Highest quality FLUX model for development and testing.",
    costPerRun: 0.025,
    avgLatencyMs: 12000,
    supportsStreaming: false,
    qualityScore: 0.95,
    costPerToken: 0.025,
  },
  {
    id: "playground-v2",
    name: "playgroundai/playground-v2.5-1024px-aesthetic",
    displayName: "Playground v2.5",
    provider: "Playground AI",
    modality: "image",
    description: "Optimized for aesthetic quality. Great for artistic images.",
    costPerRun: 0.01,
    avgLatencyMs: 7000,
    supportsStreaming: false,
    qualityScore: 0.88,
    costPerToken: 0.01,
  },
];

export function getModelById(id: string): Model | undefined {
  return MODELS.find((m) => m.id === id);
}

export function getModelsByModality(modality: Modality): Model[] {
  return MODELS.filter((m) => m.modality === modality);
}
