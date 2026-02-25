# AGENTS.md

## Cursor Cloud specific instructions

This is a single-service **Next.js 16** app (App Router + Turbopack). No monorepo, no Docker, no database.

### Running the app

```bash
npm run dev        # starts dev server on http://localhost:3000
```

The app boots in **Demo mode** by default (cached fixtures, zero external deps). To enable **Live mode**, set `REPLICATE_API_TOKEN` in `.env.local` and restart.

### Key commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Build | `npm run build` |

### Caveats

- **No test suite exists** in this repo. There are no unit/integration tests — lint and build are the primary automated checks.
- **Lint has pre-existing issues**: 1 error (`react-hooks/purity` in `output-panel.tsx`) and 2 warnings (`@typescript-eslint/no-unused-vars`). These are in existing code and `npm run lint` exits with code 1.
- The app uses **Node.js 18.17+** (currently runs on v22). No `.nvmrc` or `.node-version` file exists.
- Demo mode preset prompts use fixture data in `public/fixtures/` — no network access required for testing the UI flow.
