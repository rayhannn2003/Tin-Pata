# Tin Pata Web — Setup

## Install

```bash
cd tin-pata-web
npm install
```

## Environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Fill in values from Supabase Dashboard → **Project Settings** → **API**:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy anon JWT **or** use publishable key below |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Optional `sb_publishable_...` (preferred) |
| `GEMINI_API_KEY` | Server-only Gemini Developer API key from Google AI Studio |
| `GEMINI_MODEL` | Optional model override; defaults to `gemini-3-flash-preview` |

Never commit `.env.local`. Never put the service role key in the web app. Never prefix
`GEMINI_API_KEY` with `NEXT_PUBLIC_`.

For AI summaries, run
[`V2_SUPABASE_AI_SUMMARIES.sql`](../../docs/V2_SUPABASE_AI_SUMMARIES.sql) once in the Supabase SQL
Editor.
It creates an owner-only summary cache and an atomic limit of 20 generated summaries per user per
UTC day. Cache hits are free.

Turn **OFF** email confirmation in Supabase if using the same auth flow as mobile.

## Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Deploy (Vercel)

1. Import the `tin-pata-web` directory as a Vercel project (or monorepo root with root directory `tin-pata-web`).
2. Add the same `NEXT_PUBLIC_*` variables plus server-only `GEMINI_API_KEY` in Vercel →
   Settings → Environment Variables.
3. Deploy — Next.js App Router is detected automatically.

```bash
npx vercel
```

## Deploy (VPS)

See **[WEB_DEPLOY_VPS.md](./WEB_DEPLOY_VPS.md)** for a full Nginx + PM2 + HTTPS checklist.
