import { MODELS } from "./models";

// ---------------------------------------------------------------------------
// Model whitelist – only these Replicate model names are accepted
// ---------------------------------------------------------------------------
const ALLOWED_MODEL_NAMES = new Set(MODELS.map((m) => m.name));

export function isAllowedModel(modelName: string): boolean {
  return ALLOWED_MODEL_NAMES.has(modelName);
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------
const MAX_PROMPT_LENGTH = 10_000;
const MAX_MODEL_NAME_LENGTH = 256;

export interface ValidationError {
  error: string;
  status: number;
}

export function validatePredictionInput(body: unknown): ValidationError | { modelName: string; prompt: string } {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return { error: "Invalid request body", status: 400 };
  }

  const { modelName, prompt } = body as Record<string, unknown>;

  if (typeof modelName !== "string" || modelName.length === 0) {
    return { error: "modelName is required and must be a string", status: 400 };
  }

  if (modelName.length > MAX_MODEL_NAME_LENGTH) {
    return { error: "modelName is too long", status: 400 };
  }

  if (!isAllowedModel(modelName)) {
    return { error: "Model not supported", status: 400 };
  }

  if (typeof prompt !== "string" || prompt.length === 0) {
    return { error: "prompt is required and must be a string", status: 400 };
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return { error: `prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`, status: 400 };
  }

  return { modelName, prompt };
}

export function isValidationError(result: ValidationError | { modelName: string; prompt: string }): result is ValidationError {
  return "error" in result && "status" in result;
}

// ---------------------------------------------------------------------------
// Rate limiting – simple sliding-window per IP
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // per window

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (entry.timestamps.length === 0) rateLimitMap.delete(ip);
  }
}, 5 * 60_000);

export function checkRateLimit(request: Request): ValidationError | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  let entry = rateLimitMap.get(ip);

  if (!entry) {
    entry = { timestamps: [] };
    rateLimitMap.set(ip, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  entry.timestamps.push(now);

  if (entry.timestamps.length > RATE_LIMIT_MAX_REQUESTS) {
    return { error: "Too many requests. Please try again later.", status: 429 };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Error sanitization – never leak internal details to the client
// ---------------------------------------------------------------------------
export function sanitizeError(err: unknown): string {
  if (process.env.NODE_ENV === "development" && err instanceof Error) {
    return err.message;
  }
  return "An error occurred processing your request";
}

// ---------------------------------------------------------------------------
// Security headers applied to every API response
// ---------------------------------------------------------------------------
export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};
