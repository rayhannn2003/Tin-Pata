# Tin Pata API (`tin-pata-api`)

The trusted server layer for Tin Pata. It is the only place that holds
`OPENAI_API_KEY`, owns the AI prompts, and enforces per-user rate limits.

```
Web (Next.js) ─┐
               ├─► tin-pata-api ──► OpenAI Responses API
Mobile (Expo) ─┘                └─► Supabase (usage logging, as the calling user)
```

Ordinary RLS-protected CRUD and sync do **not** go through here — the clients talk to
Supabase directly for that. Only operations needing a server secret, a server-owned
prompt, or a rate limit are proxied.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/health` | none | Liveness + config presence booleans. Used by CI/CD. |
| `POST` | `/api/ai/explain` | Supabase bearer token | Explain a selected passage |

Full contract, error codes, and security model: [`../docs/AI_BACKEND.md`](../docs/AI_BACKEND.md).

## Local development

```bash
npm ci
cp .env.example .env     # fill in Supabase + OpenAI values
npm run dev              # http://localhost:3016
curl -s localhost:3016/health
```

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Watch mode via tsx, loads `.env` if present |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | Run the built server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | `node:test` suite |

## Layout

```
src/
  app.ts  server.ts               Express app / process entry
  config/      env  supabase  openai
  routes/      health  ai
  controllers/ ai
  services/    ai  openai  ai-usage
  middleware/  auth  rate-limit  error  request-id
  schemas/     ai (request)  explain-response (model output)
  prompts/     explain-text
  types/       ai
  utils/       logger  respond
tests/
```

`types/ai.ts` is mirrored by hand in `tin-pata-web/types/ai.ts` — change both together.

## Rules

- Never read identity (`user_id`, `email`, ownership) from a request body. It comes
  from the verified token.
- Never use the Supabase **service-role** key here. The backend acts as the calling
  user so RLS still applies.
- Never log the selected passage, the prompt, the model's response, or a token.
- Never accept a client-supplied prompt or model name. Clients choose a `mode`.
- New AI actions reuse `services/openai.service.ts` rather than calling OpenAI directly.

## Deployment

PM2 (`ecosystem.config.cjs`) on the VPS, release-directory layout, secrets in
`shared/.env` which CI never writes. See
[`../docs/VPS_DEPLOYMENT.md`](../docs/VPS_DEPLOYMENT.md). Pipeline:
`.github/workflows/backend-deploy.yml`.
