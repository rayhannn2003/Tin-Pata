# Tin Pata AI — Backend Architecture

AI runs on the Tin Pata backend, not in Supabase Edge Functions and not in the
clients. This is the only place `OPENAI_API_KEY` exists.

```
Web (Next.js)  ─┐
                ├─► Tin Pata Backend ──► OpenAI Responses API
Mobile (Expo)  ─┘   (tin-pata-api)   └─► Supabase (usage logging, as the user)
        │
        └──────────► Supabase directly, for ordinary RLS-protected CRUD & sync
```

This is deliberately **hybrid**. The backend is not a proxy for everything: library
metadata, reading sessions, bookmarks, notes and PDF storage keep talking to Supabase
directly, protected by RLS. Only operations that need a server-held secret, a
server-owned prompt, or a rate limit go through the backend.

## Why not Edge Functions

The previous implementation lived in `supabase/functions/ai-reading-assistant/`. It
has been removed — see `supabase/functions/AI_EDGE_FUNCTION_REMOVED.md`, which also
lists the **manual undeploy steps you still need to run**. Moving to the backend buys
room for the things v2.2A is a stepping stone toward: RAG, PDF text extraction,
embeddings, background jobs and queues, none of which fit a per-request edge isolate.

## The endpoint

```http
POST /api/ai/explain
Authorization: Bearer <supabase-access-token>
Content-Type: application/json
```

```json
{
  "text": "The passage the reader selected…",
  "mode": "simple_english",
  "context": { "bookId": "…", "bookTitle": "…", "pageNumber": 42 }
}
```

`mode` is one of: `simple_english`, `very_simple_english`, `bangla`,
`english_bangla`, `vocabulary`, `sentence_by_sentence`.

Response — deterministic, schema-validated, no hidden reasoning:

```json
{
  "action": "explain_text",
  "mode": "simple_english",
  "mainIdea": "…",
  "explanation": "…",
  "simpleEnglish": "…",
  "banglaExplanation": "…",
  "vocabulary": [
    { "term": "…", "simpleMeaning": "…", "banglaMeaning": "…", "contextualMeaning": "…" }
  ],
  "sentenceBreakdown": [
    { "original": "…", "simpleExplanation": "…", "banglaExplanation": "…" }
  ]
}
```

Fields that do not apply to the chosen mode are **omitted**, not null, so the client
can render from presence alone.

Errors always have the same shape:

```json
{ "error": { "code": "rate_limited", "message": "Too many requests. Try again shortly." } }
```

| Code | Status |
|------|--------|
| `unauthorized` | 401 |
| `invalid_request`, `text_too_short`, `unsupported_action`, `unsupported_mode` | 400 |
| `text_too_long` | 413 |
| `rate_limited` | 429 |
| `invalid_model_response` | 502 |
| `provider_unavailable`, `server_misconfigured` | 503 |
| `unknown` | 500 |

## Request flow

```
HTTP request
   ↓ request-id.middleware      correlation id for the logs
   ↓ cors                       browser origin allowlist
   ↓ express.json (256 KB cap)
   ↓ auth.middleware            verify Supabase token → user id
   ↓ rate-limit.middleware      per authenticated user
   ↓ ai.controller              validate body
   ↓ ai.service                 orchestrate + record usage
   ↓ openai.service             the only OpenAI caller
   ↓ structured JSON response
```

Layout:

```
backend/src/
  app.ts  server.ts
  config/      env.ts  supabase.ts  openai.ts
  routes/      health.routes.ts  ai.routes.ts
  controllers/ ai.controller.ts
  services/    ai.service.ts  openai.service.ts  ai-usage.service.ts
  middleware/  auth.middleware.ts  rate-limit.middleware.ts
               error.middleware.ts  request-id.middleware.ts
  schemas/     ai.schema.ts  explain-response.schema.ts
  prompts/     explain-text.prompt.ts
  types/       ai.ts
  utils/       logger.ts  respond.ts
```

## Authentication

The client sends its Supabase access token as a bearer token. The backend verifies it
against `GET {SUPABASE_URL}/auth/v1/user` on every request and takes the user id from
the verified response.

**Nothing about identity is read from the request body** — no `user_id`, no `email`,
no ownership claim. A body carrying those fields is accepted but the fields are
discarded (there is a test asserting exactly this). A missing or invalid token is
`401`, with the reason logged server-side only.

The backend uses the **anon/publishable key**, never the service-role key, and writes
to Supabase as the calling user — so RLS still governs everything it touches.

## Prompt safety

The client picks a *mode*. It cannot send a prompt, system instructions, a model name,
or tool configuration. The prompt lives in `prompts/explain-text.prompt.ts` and:

- states that the passage is untrusted data and must never be obeyed as instructions;
- wraps the passage in per-request random nonce delimiters, so text inside it cannot
  close the block and impersonate the surrounding instructions;
- forbids revealing the instructions or the model's reasoning.

`tools: []` — no web search, no file search, no code interpreter. `store: false` —
passages are not retained by the provider.

## Input limits

`MAX_EXPLAIN_TEXT_CHARS = 12000`. Oversized selections are **rejected, never silently
truncated**: a half-explained passage is worse than a clear "pick a smaller
selection". `MIN_EXPLAIN_TEXT_CHARS = 12` — below that it is a word, and the
dictionary handles it.

## Rate limiting

Per authenticated user, fixed window, default 20 requests / 5 minutes
(`AI_RATE_LIMIT_MAX_REQUESTS`, `AI_RATE_LIMIT_WINDOW_MS`). Returns `429` with
`Retry-After`.

Keyed on user id rather than IP, so one office or one mobile carrier NAT cannot
exhaust everyone's quota. State is **in-process**: one PM2 fork holds the whole
counter. If the API is ever scaled to cluster mode or a second host, each process
keeps its own window and the effective limit multiplies — that is the moment to swap
in Redis. The `RateLimitStore` interface exists for exactly that: implement it against
Redis and pass it to `createRateLimiter`, no caller changes.

## Usage logging

Best-effort insert into `ai_usage_events` (existing table, unchanged):

```
id · user_id · action · model · input_tokens · output_tokens
total_tokens · latency_ms · status · created_at
```

Never logged: the selected passage, the prompt, the model's response, or any book
content. The goal is cost and operational monitoring, not content surveillance. A
failed insert never fails the user's request. Disable with `AI_USAGE_LOGGING=0`.

Server logs are structured JSON and follow the same rule — request id, mode, status,
latency, token counts, model. Never the passage, never a token, never a key.

## Health

```http
GET /health
```

```json
{
  "status": "ok",
  "service": "tin-pata-api",
  "version": "<git sha>",
  "environment": "production",
  "uptimeSeconds": 1234,
  "timestamp": "2026-08-29T…",
  "dependencies": { "supabase": true, "openai": true }
}
```

`dependencies` are **presence booleans only** — enough to diagnose a bad deploy,
useless to an attacker. No URLs, no key fragments, no paths, no versions of anything
internal. Used by the backend CI/CD health gate.

## Environment

Server-side `.env` (lives at `/var/www/tin-pata-api/shared/.env`, never in git,
never uploaded by CI):

```env
NODE_ENV=production
PORT=3016
SUPABASE_URL=
SUPABASE_ANON_KEY=
OPENAI_API_KEY=
OPENAI_EXPLAIN_MODEL=
OPENAI_EXPLAIN_REASONING_EFFORT=low
AI_ALLOWED_ORIGINS=https://book.daftar-e.com,http://localhost:3000
AI_RATE_LIMIT_WINDOW_MS=300000
AI_RATE_LIMIT_MAX_REQUESTS=20
AI_USAGE_LOGGING=1
```

`OPENAI_API_KEY` must **never** appear as `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*`, as a
GitHub Actions build secret, in the browser bundle, or in the APK. Both the web and
Android workflows have a step that fails the build if it does.

Client-side, the only AI-related variable is the backend's base URL:
`NEXT_PUBLIC_API_URL` (web) and `EXPO_PUBLIC_API_URL` (mobile).

## CORS

`AI_ALLOWED_ORIGINS` is a comma-separated browser allowlist. Native mobile clients
send no `Origin` header and are unaffected by CORS — their gate is the Supabase token.
`credentials` is off: clients authenticate with an `Authorization` header, not a
cookie, so the browser is never asked to attach ambient credentials cross-origin.

## Mobile

Not implemented yet — v2.2A ships web only. The endpoint is deliberately
platform-neutral: when mobile text selection lands it calls the same
`POST /api/ai/explain` with the same body and the same bearer token. `types/ai.ts`
can be copied across as-is.

## Future

The structure anticipates, without yet implementing: RAG over book text, PDF text
extraction, embeddings, background jobs/queues, and further actions
(`summarize_notes`, `session_recap`). New actions should add a route + controller +
prompt and reuse `openai.service.ts` rather than calling OpenAI directly.
