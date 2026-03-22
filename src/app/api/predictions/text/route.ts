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
  "google/gemma-7b-it":
    "google-deepmind/gemma-7b-it:2790a695e5dcae15506138cc4718d1106d0d475e6dca4b1d43f42414647993d5",
};

// Models that don't support Replicate's streaming API — use run() instead
const NON_STREAMING_MODELS = new Set([
  "google/gemma-7b-it",
  "meta/llama-2-13b-chat",
]);

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  ...SECURITY_HEADERS,
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
  const modelRef = VERSION_MAP[modelName] ?? (modelName as `${string}/${string}`);
  const encoder = new TextEncoder();

  // Non-streaming models: use run() and send the entire output as one token
  if (NON_STREAMING_MODELS.has(modelName)) {
    try {
      const output = await replicate.run(modelRef, {
        input: { prompt },
      });

      const text = Array.isArray(output) ? output.join("") : String(output);

      const tokenData = JSON.stringify({ type: "token", data: text });
      const doneData = JSON.stringify({ type: "done", data: "" });
      const body = `data: ${tokenData}\n\ndata: ${doneData}\n\n`;

      return new Response(body, { headers: SSE_HEADERS });
    } catch (err) {
      const errorData = JSON.stringify({
        type: "error",
        data: sanitizeError(err),
      });
      return new Response(`data: ${errorData}\n\n`, { headers: SSE_HEADERS });
    }
  }

  // Streaming models: use stream() with SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const prediction = replicate.stream(modelRef, {
          input: { prompt },
        });

        for await (const event of prediction) {
          const chunk = String(event);
          const data = JSON.stringify({ type: "token", data: chunk });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }

        const doneData = JSON.stringify({ type: "done", data: "" });
        controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
      } catch (err) {
        const errorData = JSON.stringify({
          type: "error",
          data: sanitizeError(err),
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
