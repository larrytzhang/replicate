import Replicate from "replicate";

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

export async function POST(request: Request) {
  const { modelName, prompt } = (await request.json()) as {
    modelName: string;
    prompt: string;
  };

  if (!modelName || !prompt) {
    return new Response(
      JSON.stringify({ error: "modelName and prompt are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

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

      return new Response(body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const errorData = JSON.stringify({ type: "error", data: errorMsg });
      return new Response(`data: ${errorData}\n\n`, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
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
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        const errorData = JSON.stringify({ type: "error", data: errorMsg });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
