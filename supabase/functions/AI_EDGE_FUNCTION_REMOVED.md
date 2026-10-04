# The AI Edge Function has been removed

`supabase/functions/ai-reading-assistant/` was Tin Pata's AI gateway up to v2.2A.
As of the backend migration it is **replaced by the Tin Pata backend** (`backend/`),
which is now the only place that holds `OPENAI_API_KEY`.

| Before | After |
|--------|-------|
| `POST {SUPABASE_URL}/functions/v1/ai-reading-assistant` | `POST {API_URL}/api/ai/explain` |
| Deno, Supabase Edge runtime | Node.js + Express on the VPS |
| `supabase secrets set OPENAI_API_KEY=...` | `/var/www/tin-pata-api/shared/.env` |

Everything the function did was carried over, not rewritten:

| Edge Function file | Backend equivalent |
|--------------------|--------------------|
| `prompts.ts` | `backend/src/prompts/explain-text.prompt.ts` |
| `responseSchema.ts` | `backend/src/schemas/explain-response.schema.ts` |
| `validation.ts` | `backend/src/schemas/ai.schema.ts` |
| `openai.ts` | `backend/src/services/openai.service.ts` |
| `supabase.ts` | `backend/src/config/supabase.ts` + `services/ai-usage.service.ts` |
| `types.ts` | `backend/src/types/ai.ts` |
| `index.ts` | `backend/src/app.ts` + routes/controllers/middleware |

The git history still contains the original files if you need to compare.

## Manual cleanup still required

Deleting this source does **not** undeploy anything. If the function was ever
deployed, it is still live and still holds your OpenAI key. On the machine where
you run the Supabase CLI:

```bash
# 1. Confirm whether it is deployed
supabase functions list

# 2. Remove the deployed function
supabase functions delete ai-reading-assistant

# 3. Remove the secret it used (the backend has its own copy now)
supabase secrets unset OPENAI_API_KEY
supabase secrets unset OPENAI_EXPLAIN_MODEL
supabase secrets unset OPENAI_EXPLAIN_REASONING_EFFORT
supabase secrets unset AI_ALLOWED_ORIGINS
supabase secrets unset AI_USAGE_LOGGING
```

**Rotate the OpenAI key** after this: it existed in two places during the
migration, so treat the old value as exposed and issue a fresh one for the
backend's `.env`.

The `ai_usage_events` table is unchanged and still used — the backend writes to it
as the calling user, so its RLS policies keep working as-is.
