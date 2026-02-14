import { getModelById } from "./models";
import textFixtures from "./fixtures/text-fixtures.json";
import imageFixtures from "./fixtures/image-fixtures.json";
import { PRESET_PROMPTS } from "./demo-presets";

// --- Types ---

export interface StreamEvent {
  type: "token" | "done" | "error";
  data: string;
}

export interface PredictionResult {
  id: string;
  status: "succeeded" | "failed";
  output: string;
  latencyMs: number;
  cost: number;
  error?: string;
}

interface TextFixtureModel {
  output: string;
  latencyMs: number;
  costUsd: number;
  tokenCount: number;
}

interface TextFixture {
  prompt: string;
  category: string;
  models: Record<string, TextFixtureModel>;
}

interface ImageFixtureModel {
  output: string;
  latencyMs: number;
  costUsd: number;
}

interface ImageFixture {
  prompt: string;
  category: string;
  models: Record<string, ImageFixtureModel>;
}

// --- Seeded PRNG (djb2 hash + simple LCG) ---

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) | 0;
    return (state >>> 0) / 4294967296;
  };
}

// --- Prompt Matching ---

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  coding: ["code", "function", "implement", "program", "algorithm", "debug", "class", "api", "binary", "sort", "search", "array", "javascript", "python", "typescript", "java", "rust", "build"],
  creative: ["story", "poem", "creative", "write", "narrative", "fiction", "imagine", "tale", "lyric", "novel", "chapter", "ocean", "robot", "fantasy"],
  reasoning: ["explain", "why", "how does", "how do", "what is", "compare", "analyze", "reason", "neural", "network", "garbage", "collection", "backpropagation", "machine learning"],
  summarization: ["summarize", "tldr", "brief", "key points", "overview", "differences", "compare", "versus", "vs", "pros and cons", "rest", "graphql"],
  general: [],
};

function normalizePrompt(prompt: string): string {
  return prompt.trim().toLowerCase().replace(/\s+/g, " ");
}

function classifyCategory(prompt: string): string {
  const lower = normalizePrompt(prompt);

  let bestCategory = "general";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "general") continue;
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

function findTextFixture(prompt: string): TextFixture {
  const normalized = normalizePrompt(prompt);
  const fixtures = textFixtures as TextFixture[];

  // 1. Exact match (normalized)
  const exact = fixtures.find(
    (f) => normalizePrompt(f.prompt) === normalized
  );
  if (exact) return exact;

  // 2. Category match with deterministic selection via prompt hash
  const category = classifyCategory(prompt);
  const categoryFixtures = fixtures.filter((f) => f.category === category);

  if (categoryFixtures.length > 0) {
    const hash = djb2Hash(normalized);
    return categoryFixtures[hash % categoryFixtures.length];
  }

  // 3. Fallback: use prompt hash to pick any fixture
  const hash = djb2Hash(normalized);
  return fixtures[hash % fixtures.length];
}

function findImageFixture(prompt: string): ImageFixture {
  const normalized = normalizePrompt(prompt);
  const fixtures = imageFixtures as ImageFixture[];

  // 1. Exact match
  const exact = fixtures.find(
    (f) => normalizePrompt(f.prompt) === normalized
  );
  if (exact) return exact;

  // 2. Keyword-based category match
  const lower = normalized;
  const categoryMap: Record<string, string[]> = {
    landscape: ["mountain", "landscape", "sunset", "sunrise", "nature", "forest", "lake", "scenery", "valley"],
    cyberpunk: ["cyberpunk", "neon", "city", "night", "rain", "futuristic", "sci-fi", "dystopian", "urban"],
    portrait: ["portrait", "person", "face", "craftsman", "elderly", "human", "man", "woman", "character"],
    abstract: ["abstract", "geometric", "shapes", "flowing", "colors", "pattern", "art", "surreal", "psychedelic"],
    interior: ["café", "cafe", "interior", "room", "cozy", "warm", "kitchen", "library", "books", "home"],
  };

  let bestCategory = "";
  let bestScore = 0;
  for (const [category, keywords] of Object.entries(categoryMap)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  if (bestCategory) {
    const categoryFixtures = fixtures.filter(
      (f) => f.category === bestCategory
    );
    if (categoryFixtures.length > 0) {
      const hash = djb2Hash(normalized);
      return categoryFixtures[hash % categoryFixtures.length];
    }
  }

  // 3. Fallback: hash-based selection
  const hash = djb2Hash(normalized);
  return fixtures[hash % fixtures.length];
}

// --- Streaming Realism ---

/**
 * Split text into sentence-level chunks, preserving delimiters.
 * Splits on sentence endings, paragraph breaks, and code block boundaries.
 */
function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  // Split on sentence-ending punctuation, double newlines, or code fences
  const pattern = /(?<=\.(?:\s|$))|(?<=!\s)|(?<=\?\s)|(?<=\n\n)|(?<=```\n)|(?<=```)/g;
  const parts = text.split(pattern).filter((p) => p.length > 0);

  // Merge very small chunks with their predecessor
  for (const part of parts) {
    if (chunks.length > 0 && chunks[chunks.length - 1].length < 20) {
      chunks[chunks.length - 1] += part;
    } else {
      chunks.push(part);
    }
  }

  // If splitting didn't work well, fall back to line-based splitting
  if (chunks.length <= 1 && text.length > 100) {
    return text.split(/(?<=\n)/).filter((p) => p.length > 0);
  }

  return chunks.length > 0 ? chunks : [text];
}

function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

// --- Deterministic Failure Simulation ---

/** Specific model+fixture combinations that should fail */
const FAILURE_COMBOS: Record<string, string[]> = {
  // gemma-7b fails on the binary search prompt
  "gemma-7b": [
    "implement a binary search algorithm in javascript with error handling",
  ],
};

function shouldFail(modelId: string, normalizedPrompt: string): boolean {
  const failPrompts = FAILURE_COMBOS[modelId];
  if (!failPrompts) return false;
  return failPrompts.some((fp) => normalizedPrompt.includes(fp));
}

// --- Public API ---

export async function* demoTextStream(
  modelId: string,
  prompt: string,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const model = getModelById(modelId);
  if (!model || model.modality !== "text") {
    throw new Error(`Model ${modelId} is not a text model`);
  }

  const normalized = normalizePrompt(prompt);

  // Instant path for exact-match preset prompts — no streaming delay
  if (PRESET_PROMPTS.has(prompt)) {
    const fixture = findTextFixture(prompt);
    const modelFixture = fixture.models[modelId];
    const fixtureData = modelFixture ?? Object.values(fixture.models)[0];
    yield { type: "token", data: fixtureData.output };
    yield { type: "done", data: "" };
    return;
  }

  // Deterministic failure
  if (shouldFail(modelId, normalized)) {
    await abortableDelay(300 + (djb2Hash(normalized + modelId) % 400), signal);
    yield { type: "error", data: "Model inference failed: CUDA out of memory" };
    return;
  }

  const fixture = findTextFixture(prompt);
  const modelFixture = fixture.models[modelId];

  // If this model doesn't have a fixture entry, use a fallback model
  const fixtureData = modelFixture ?? Object.values(fixture.models)[0];

  const text = fixtureData.output;
  const chunks = splitIntoChunks(text);
  const baseLatency = fixtureData.latencyMs;

  // Seeded PRNG for deterministic timing
  const rng = seededRandom(djb2Hash(normalized + modelId));

  // Base delay per chunk
  const delayPerChunk = baseLatency / chunks.length;

  for (let i = 0; i < chunks.length; i++) {
    if (signal?.aborted) return;

    // Warm-up: first 2 chunks are 1.5x slower
    const warmupMultiplier = i < 2 ? 1.5 : 1.0;

    // ±15% jitter from seeded PRNG
    const jitter = 1 + (rng() * 0.3 - 0.15);

    const delay = delayPerChunk * warmupMultiplier * jitter;
    await abortableDelay(delay, signal);

    yield { type: "token", data: chunks[i] };
  }

  yield { type: "done", data: "" };
}

export async function demoImagePrediction(
  modelId: string,
  prompt: string,
  signal?: AbortSignal
): Promise<PredictionResult> {
  const model = getModelById(modelId);
  if (!model || model.modality !== "image") {
    throw new Error(`Model ${modelId} is not an image model`);
  }

  const normalized = normalizePrompt(prompt);

  // Instant path for exact-match preset prompts — no delay
  if (PRESET_PROMPTS.has(prompt)) {
    const fixture = findImageFixture(prompt);
    const modelFixture = fixture.models[modelId];
    const fixtureData = modelFixture ?? Object.values(fixture.models)[0];
    return {
      id: `pred_${Date.now()}_${modelId}`,
      status: "succeeded",
      output: fixtureData.output,
      latencyMs: fixtureData.latencyMs,
      cost: fixtureData.costUsd,
    };
  }

  // Deterministic failure — none defined for image models currently
  if (shouldFail(modelId, normalized)) {
    const latency = 500 + (djb2Hash(normalized + modelId) % 500);
    await abortableDelay(latency, signal);
    return {
      id: `pred_${Date.now()}_${modelId}`,
      status: "failed",
      output: "",
      latencyMs: latency,
      cost: 0,
      error: "GPU memory allocation failed. Please try again.",
    };
  }

  const fixture = findImageFixture(prompt);
  const modelFixture = fixture.models[modelId];
  const fixtureData = modelFixture ?? Object.values(fixture.models)[0];

  // Simulate latency with ±15% seeded jitter
  const rng = seededRandom(djb2Hash(normalized + modelId));
  const jitter = 1 + (rng() * 0.3 - 0.15);
  const latency = fixtureData.latencyMs * jitter;

  await abortableDelay(latency, signal);

  return {
    id: `pred_${Date.now()}_${modelId}`,
    status: "succeeded",
    output: fixtureData.output,
    latencyMs: Math.round(latency),
    cost: fixtureData.costUsd,
  };
}
