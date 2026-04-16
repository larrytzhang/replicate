# Model Comparator

> **Portfolio project for Replicate leadership.** I built this as a hands-on exploration of a real pain point Replicate customers face: with 50,000+ models in the catalog, how does a developer actually pick the right one for their use case? This app lets you run 2–4 Replicate models side by side on the same prompt, streams their outputs in real time, and surfaces the cost/latency/quality tradeoffs that drive a model choice. — [Larry Zhang](https://www.linkedin.com/in/larry-zhang-697636370)

**Live demo:** _add your Vercel URL here after deploying_

---

## What it does

Pick 2–4 models, type a prompt, hit Run. The app fires all requests to Replicate in parallel and streams the outputs back into a comparison grid. After the runs complete, three panels summarize the tradeoffs:

- **Cost breakdown** with a "save X% by choosing model A over B" callout.
- **Latency comparison** including time-to-first-token (TTFT), the metric that matters most for chat UX.
- **Recommendation engine** that ranks models by a weighted blend of quality, cost, and speed — weights you control with sliders.

Sessions persist to `localStorage` and can be encoded into a shareable URL so a teammate can open the same comparison in one click.

## Try it without an API token

The app ships in **Demo mode** by default: select a preset prompt and you get cached, deterministic outputs with simulated streaming latency. No token, no spend, no setup — click-to-run in under 10 seconds.

Drop a `REPLICATE_API_TOKEN` into `.env.local` and the header exposes a toggle to **Live mode**, which proxies every request through `/api/predictions/*` to the actual Replicate SDK.

## Quick start

```bash
npm install
npm run dev
# → http://localhost:3000
```

To enable Live mode locally:

```bash
echo "REPLICATE_API_TOKEN=r8_your_token_here" > .env.local
npm run dev
```

To run the test suite:

```bash
npm test
```

## Supported models

| Modality | Models |
|----------|--------|
| Text     | Llama 3 8B, Llama 3 70B, Llama 3.1 405B, Llama 2 13B, Gemma 7B IT |
| Image    | SDXL, SDXL Lightning, FLUX.1 Schnell, FLUX.1 Dev, Playground v2.5 |

Each model has a metadata record in `src/lib/models.ts` (cost, avg latency, quality score, streaming support) that feeds the recommendation engine and cost estimates.

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** React 19, Tailwind CSS 4, Lucide icons
- **State:** Zustand
- **Inference:** Replicate Node SDK (`replicate` npm package)
- **Tests:** Vitest + jsdom

## Architecture

Three layers, organized as a feature slice under `src/features/comparator/`:

```
src/
├── app/
│   └── api/
│       ├── config/             GET: {liveAvailable, defaultMode}
│       └── predictions/
│           ├── text/           POST: SSE proxy to Replicate .stream()/.run()
│           └── image/          POST: JSON proxy to Replicate .run()
├── features/comparator/
│   ├── components/             AppShell, ModelSelector, OutputPanel, CostSummary, …
│   ├── lib/
│   │   ├── prediction-runner.ts    Parallel dispatch + per-model AbortController
│   │   ├── recommendation.ts       Weighted quality/cost/speed scoring
│   │   └── session.ts              localStorage + URL param serialization
│   └── store/comparator-store.ts   Zustand store (runs, predictions, prefs)
└── lib/
    ├── api-security.ts         Input validation, per-IP rate limiting, error sanitization
    ├── demo-client.ts          Fixture-backed streaming for Demo mode
    ├── prediction-provider.ts  Strategy routing: Demo vs. Live
    └── replicate-client.ts     Client-side SSE parser
```

### Execution flow (Live mode)

1. User hits Run. `prediction-runner.ts` creates a `runId` and starts the store's run.
2. For each selected model, the client POSTs to `/api/predictions/text` or `/api/predictions/image`.
3. The API route validates the input, rate-limits per IP, and calls the Replicate SDK — `.stream()` for streaming-capable text models, `.run()` otherwise.
4. Text routes pipe SSE back to the client; the client parser dispatches tokens into the store, which records TTFT on the first token.
5. On completion, the store records `predict_time` and `costUsd`; the summary panels recompute.

## Replicate SDK quirks worth knowing

If you extend `src/lib/models.ts`, these gotchas are already handled but are worth knowing:

- **Version pinning:** Models without default aliases (SDXL, SDXL Lightning, Playground v2.5, Gemma 7B) need explicit version hashes, kept in `VERSION_MAP` in the API routes.
- **Streaming fallbacks:** Gemma 7B and Llama 2 13B hang on `.stream()`. The text route detects these IDs and falls back to `.run()`, emitting the full output as a single SSE chunk so the client parser stays uniform.
- **Output coercion:** Image models return `FileOutput` objects, not strings. The image route casts with `String(output)` before returning.

## Security posture

- Per-IP sliding-window rate limit (20 req / 60s) in `src/lib/api-security.ts`.
- Strict input validation: model name whitelist, prompt length cap (10k chars), type guards.
- Error messages sanitized in production (raw errors exposed only in dev).
- Security headers in `next.config.ts`: CSP, HSTS, X-Frame-Options, Referrer-Policy.
- `REPLICATE_API_TOKEN` lives only in server env — never shipped to the client.

## Tests

`npm test` runs Vitest against the two highest-value pure-function modules:

- `recommendation.ts` — scoring math, weight edge cases, status filtering, divide-by-zero cases.
- `session.ts` — URL encoding/decoding, model whitelist enforcement, base64 round-trips, clamp + cap behavior.

## Deploy

One-click to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/larrytzhang/replicate&env=REPLICATE_API_TOKEN&envDescription=Your%20Replicate%20API%20token%20(optional%20-%20demo%20mode%20works%20without%20it))

Standard Node.js deployment otherwise:

```bash
npm run build
npm start
```

Set `REPLICATE_API_TOKEN` in the production environment to enable Live mode; without it, the deploy runs in Demo mode.

## Contact

Larry Zhang · [GitHub](https://github.com/larrytzhang) · [LinkedIn](https://www.linkedin.com/in/larry-zhang-697636370) · [larry_zhang@college.harvard.edu](mailto:larry_zhang@college.harvard.edu)
