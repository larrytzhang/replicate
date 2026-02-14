# Model Comparator

A dev tool for side-by-side evaluation of Replicate models. It runs parallel inferences, streams the outputs, and tracks telemetry (cost, latency, quality) so you can make data-driven decisions on which model fits your workload.

Ships with a zero-config Demo mode using cached fixtures so you can test the UI immediately. Drop in a Replicate token to unlock Live mode and run custom prompts against the actual endpoints.

## Core Capabilities

* **Concurrent Execution:** Run 2-4 models simultaneously against the same prompt. Handles real-time token streaming for text and handles image polling asynchronously.
* **Supported Models:**
  * *Text:* Llama 3 (8B, 70B), Llama 3.1 405B, Llama 2 13B, Gemma 7B IT.
  * *Image:* SDXL, SDXL Lightning, FLUX.1 (Schnell, Dev), Playground v2.5.
* **Telemetry & Heuristics:** Calculates per-request token costs and measures TTFT (Time to First Token) / total latency. Includes a weighted recommendation engine to optimize for speed, cost, or quality.
* **State Management:** Sessions are persisted to `localStorage` and can be serialized to the URL for easy sharing and hydration.

## Quick Start

```bash
npm install
npm run dev
```

The server spins up at `http://localhost:3000`. By default, it mounts in **Demo mode**. Select a preset prompt and multiple models to see the simulated execution flow.

### Enabling Live Mode

To hit the actual Replicate APIs, provide an API token. Create a `.env.local` file:

```bash
REPLICATE_API_TOKEN=r8_your_token_here
```

Restart the dev server. The app detects the environment variable and exposes the Demo/Live toggle in the header.

## System Architecture

The codebase is structured around feature slices to keep component logic tightly coupled with its state and types.

```text
src/
├── app/
│   └── api/
│       ├── config/           # GET: Environment capabilities { liveAvailable, defaultMode }
│       └── predictions/
│           ├── text/         # POST: Replicate SSE proxy (.stream() / .run())
│           └── image/        # POST: Replicate JSON proxy (.run())
├── features/comparator/      # Core domain logic
│   ├── components/           # Presentation & container components
│   ├── lib/                  
│   │   ├── prediction-runner.ts  # Orchestrates parallel requests + abort controllers
│   │   ├── recommendation.ts     # Scoring heuristics for model selection
│   │   └── session.ts            # Local state and URL serialization
│   └── store/
│       └── comparator-store.ts   # Global Zustand state
└── lib/                      # Infrastructure & Utilities
    ├── demo-client.ts        # Fixture mocked streaming with synthetic latency/jitter
    ├── models.ts             # Registry & metadata for the 11 supported models
    ├── prediction-provider.ts# Strategy pattern routing (Demo vs. Live)
    └── replicate-client.ts   # Client-side SSE consumer for our API routes
```

### Execution Flow

1. **Trigger:** User initiates a run. `prediction-runner.ts` spins up an `AbortController` and fires parallel requests.
2. **Routing:** `prediction-provider.ts` checks the current environment toggle.
   * **Demo:** Routes to `demo-client.ts`. Matches the prompt to a local fixture and simulates an SSE stream with realistic chunking and artificial jitter.
   * **Live:** Routes to `replicate-client.ts`, hitting our Next.js API routes.
3. **Inference (Live):** * *Text:* The API route calls the Replicate SDK and pipes the SSE stream directly back to the client.
   * *Image:* Standard JSON response returning the finalized image URL.

### Replicate SDK Integration Quirks

If you are extending the model registry, keep these Replicate-specific behaviors in mind:

* **Version Pinning:** Models without default aliases (SDXL, SDXL Lightning, Playground v2.5, Gemma 7B) will fail without explicit version hashes. These are mapped in `VERSION_MAP`.
* **Streaming Fallbacks:** Not all text models support `.stream()` (e.g., Gemma 7B and Llama 2 13B will hang silently). The API route detects these models, falls back to `.run()`, and emits the full payload as a single SSE chunk to keep the client-side parser unified.
* **Output Coercion:** Image models yield `FileOutput` streams rather than primitive strings. You must explicitly cast `String(output)` to extract the usable URI.

## Tech Stack

* **Framework:** Next.js 16 (App Router, Turbopack)
* **UI/State:** React 19, Zustand 5, Tailwind CSS 4, Lucide React
* **Inference:** Replicate Node SDK

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/replicate&env=REPLICATE_API_TOKEN&envDescription=Your%20Replicate%20API%20token%20(optional%20-%20demo%20mode%20works%20without%20it))

Standard Node.js deployment:

```bash
npm run build
npm start
```

*Note: Ensure `REPLICATE_API_TOKEN` is set in your production environment to enable Live mode, otherwise it will gracefully degrade to Demo mode.*