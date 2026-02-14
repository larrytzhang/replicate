import type { Modality } from "@/lib/models";

const STORAGE_KEY = "comparator_sessions";
const MAX_SESSIONS = 20;

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
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
  autoRun?: boolean;
}

export function parseUrlParams(): UrlParams | null {
  const params = new URLSearchParams(window.location.search);

  const modality = params.get("modality");
  if (!modality) return null;

  let prompt = params.get("prompt") ?? "";
  const promptB64 = params.get("prompt_b64");
  if (promptB64) {
    try {
      prompt = decodeURIComponent(atob(promptB64));
    } catch {
      prompt = "";
    }
  }

  const models = params.get("models")?.split(",").filter(Boolean) ?? [];
  const quality = parseInt(params.get("q") ?? "50", 10);
  const cost = parseInt(params.get("c") ?? "50", 10);
  const speed = parseInt(params.get("s") ?? "50", 10);

  return {
    modality: modality as Modality,
    selectedModelIds: models,
    prompt,
    preferences: { quality, cost, speed },
    autoRun: models.length >= 2 && prompt.length > 0,
  };
}
