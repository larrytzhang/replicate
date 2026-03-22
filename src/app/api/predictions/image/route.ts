import Replicate from "replicate";
import {
  validatePredictionInput,
  isValidationError,
  checkRateLimit,
  sanitizeError,
  SECURITY_HEADERS,
} from "@/lib/api-security";

export const maxDuration = 60;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Models that require an explicit version hash (no default version alias on Replicate)
const VERSION_MAP: Record<string, `${string}/${string}:${string}`> = {
  "bytedance/sdxl-lightning-4step":
    "bytedance/sdxl-lightning-4step:5f24084160c9089501c1b3545d9be3c27883ae2239b6f412990e82d4a6210f8f",
  "stability-ai/sdxl":
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  "playgroundai/playground-v2.5-1024px-aesthetic":
    "playgroundai/playground-v2.5-1024px-aesthetic:a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24",
};

export async function POST(request: Request) {
  // Rate limiting
  const rateLimitError = checkRateLimit(request);
  if (rateLimitError) {
    return Response.json(
      { error: rateLimitError.error },
      { status: rateLimitError.status, headers: SECURITY_HEADERS }
    );
  }

  // Input validation
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  const validated = validatePredictionInput(body);
  if (isValidationError(validated)) {
    return Response.json(
      { error: validated.error },
      { status: validated.status, headers: SECURITY_HEADERS }
    );
  }

  const { modelName, prompt } = validated;
  const startTime = Date.now();

  try {
    const modelRef = VERSION_MAP[modelName] ?? (modelName as `${string}/${string}`);

    const output = await replicate.run(modelRef, {
      input: { prompt },
    });

    const latencyMs = Date.now() - startTime;

    // Replicate image models return FileOutput objects (or arrays of them).
    // Extract the first element if array, then coerce to string to get the URL.
    const raw = Array.isArray(output) ? output[0] : output;
    const imageUrl = String(raw);

    return Response.json(
      { status: "succeeded", output: imageUrl, latencyMs },
      { headers: SECURITY_HEADERS }
    );
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return Response.json(
      {
        status: "failed",
        output: "",
        latencyMs,
        error: sanitizeError(err),
      },
      { headers: SECURITY_HEADERS }
    );
  }
}
