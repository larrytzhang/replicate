import { type Modality, MODELS } from "@/lib/models";

const STORAGE_KEY = "comparator_sessions";
const MAX_SESSIONS = 20;
const MAX_PROMPT_LENGTH = 10_000;

// Valid model IDs for URL param validation
const VALID_MODEL_IDS = new Set(MODELS.map((m) => m.id));
const VALID_MODALITIES = new Set<string>(["text", "image"]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface SavedSession {
  id: string;
  name: string;
  createdAt: number;
  modality: Modality;
  selectedModelIds: string[];
  prompt: string;
  preferences: { quality: number; cost: number; speed: number };
}

export function saveSession(session: Omit<SavedSession, "id" | "createdAt">): SavedSession {
  const sessions = loadAllSessions();
  const saved: SavedSession = {
    ...session,
    id: `session_${Date.now()}`,
    createdAt: Date.now(),
  };
  sessions.unshift(saved);
  // Cap at MAX_SESSIONS
  if (sessions.length > MAX_SESSIONS) {
    sessions.length = MAX_SESSIONS;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // localStorage quota exceeded — silently fail
  }
  return saved;
}

export function loadAllSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedSession[];
  } catch {
    return [];
  }
}

export function deleteSession(id: string): void {
  const sessions = loadAllSessions().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getShareUrl(session: Omit<SavedSession, "id" | "createdAt">): string {
  const params = new URLSearchParams();
  params.set("modality", session.modality);
  params.set("models", session.selectedModelIds.join(","));
  params.set("q", session.preferences.quality.toString());
  params.set("c", session.preferences.cost.toString());
  params.set("s", session.preferences.speed.toString());

  // Base64 encode prompt if long
  if (session.prompt.length > 100) {
    params.set("prompt_b64", btoa(encodeURIComponent(session.prompt)));
  } else {
    params.set("prompt", session.prompt);
  }

  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export interface UrlParams {
  modality?: Modality;
  selectedModelIds?: string[];
  prompt?: string;
  preferences?: { quality: number; cost: number; speed: number };
}

export function parseUrlParams(): UrlParams | null {
  const params = new URLSearchParams(window.location.search);

  // Validate modality
  const modality = params.get("modality");
  if (!modality || !VALID_MODALITIES.has(modality)) return null;

  // Validate and decode prompt
  let prompt = params.get("prompt") ?? "";
  const promptB64 = params.get("prompt_b64");
  if (promptB64) {
    try {
      prompt = decodeURIComponent(atob(promptB64));
    } catch {
      prompt = "";
    }
  }
  // Cap prompt length
  if (prompt.length > MAX_PROMPT_LENGTH) {
    prompt = prompt.slice(0, MAX_PROMPT_LENGTH);
  }

  // Validate model IDs against whitelist
  const rawModels = params.get("models")?.split(",").filter(Boolean) ?? [];
  const models = rawModels.filter((id) => VALID_MODEL_IDS.has(id));

  // Validate and clamp preference values to 0-100
  const quality = clamp(parseInt(params.get("q") ?? "50", 10) || 50, 0, 100);
  const cost = clamp(parseInt(params.get("c") ?? "50", 10) || 50, 0, 100);
  const speed = clamp(parseInt(params.get("s") ?? "50", 10) || 50, 0, 100);

  return {
    modality: modality as Modality,
    selectedModelIds: models,
    prompt,
    preferences: { quality, cost, speed },
  };
}
