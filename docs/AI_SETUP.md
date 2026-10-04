# Tin Pata AI — Setup

How to configure and run the AI feature. It lives in the **Tin Pata backend**
(`backend/`), not in a Supabase Edge Function. Architecture:
[AI_ARCHITECTURE.md](AI_ARCHITECTURE.md) · API and security:
[AI_BACKEND.md](AI_BACKEND.md) · Server setup: [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md).

**No real secret value belongs in this repository.**

## 1. Prerequisites

* Node.js 20+
* An OpenAI account with API credits
* A Supabase project (the same one the apps already use)

## 2. Get an OpenAI API key

1. Sign in at <https://platform.openai.com>.
2. **API keys → Create new secret key.** Copy it once; it is not shown again.
3. Confirm the project has credit under **Billing**, and that the model in
   `OPENAI_EXPLAIN_MODEL` is available to it.

Never paste the key into `.env.example`, a `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*`
variable, a GitHub Actions secret, a commit, or a screenshot. It belongs in exactly
one place: the backend's server-side `.env`.

> If you previously deployed the `ai-reading-assistant` Edge Function, **rotate the
> key** — the old value lived in Supabase secrets too. See
> `supabase/functions/AI_EDGE_FUNCTION_REMOVED.md` for the undeploy steps.

## 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Fill in:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=sb_publishable_…      # anon/publishable — NEVER service-role
OPENAI_API_KEY=sk-…
OPENAI_EXPLAIN_MODEL=gpt-5.6-luna
```

### Switching models

`OPENAI_EXPLAIN_MODEL` is read at startup — no code change needed. `DEFAULT_EXPLAIN_MODEL`
in `backend/src/config/openai.ts` is only the fallback when the variable is unset.
Verify the model is enabled for your OpenAI project and supports **structured outputs**
(`text.format.type = "json_schema"` with `strict: true`); the request will fail with
`invalid_model_response` if it does not.

`OPENAI_EXPLAIN_REASONING_EFFORT` accepts `minimal | low | medium | high` (default
`low`). Models that reject the parameter are retried once without it automatically.

## 4. Usage table

`ai_usage_events` records token counts and latency only — never passage text. Create it
with `docs/V2_SUPABASE_AI_USAGE_EVENTS.sql` if it does not already exist. Set
`AI_USAGE_LOGGING=0` to disable. A missing table never fails a user request.

## 5. Run it

```bash
cd backend
npm ci
npm run dev            # http://localhost:3016
```

```bash
curl -s http://localhost:3016/health
# {"status":"ok",...,"dependencies":{"supabase":true,"openai":true}}
```

Both dependencies must be `true`. If either is `false`, `.env` is incomplete.

Point the web app at it — in `tin-pata-web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3016
```

Then `cd tin-pata-web && npm run dev`.

## 6. Test the endpoint directly

The endpoint needs a real Supabase access token. Grab one from the browser after
signing in (DevTools → Application → Local Storage → the `sb-*-auth-token` entry):

```bash
curl -s -X POST http://localhost:3016/api/ai/explain \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
        "text": "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
        "mode": "simple_english"
      }' | jq
```

## 7. Using the feature

In the web reader: select text in the PDF → **Explain** → choose a mode → the
explanation panel opens. The default mode is a user setting
(`ai_default_explanation_mode`).

## 8. Production

The backend runs under PM2 on the VPS with its `.env` at
`/var/www/tin-pata-api/shared/.env`, which CI never reads or overwrites. Full
procedure in [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md).

## Troubleshooting

| Symptom | Cause |
|---|---|
| `server_misconfigured` | `OPENAI_API_KEY` unset, or Supabase env missing. Check `/health`. |
| `unauthorized` on every request | Token expired, or `SUPABASE_URL`/`SUPABASE_ANON_KEY` wrong |
| `invalid_model_response` | Model does not support strict structured outputs, or hit `max_output_tokens` |
| `provider_unavailable` | OpenAI unreachable, out of credit, or timed out (60s) |
| `rate_limited` | 20 requests / 5 min per user by default |
| `text_too_long` | Selection over 12,000 characters — select less |
| CORS error in the browser | Origin missing from `AI_ALLOWED_ORIGINS` |
| Web says `server_misconfigured` immediately | `NEXT_PUBLIC_API_URL` unset at **build** time |
