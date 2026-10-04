# Tin Pata AI — Architecture

Status: **v2.2A — Explain Selected Text (web)**

> Transport moved from a Supabase Edge Function to the Tin Pata backend. This document
> covers the *product* design — modes, output shape, cost, privacy. For the API
> surface, auth, rate limiting and deployment see **[AI_BACKEND.md](AI_BACKEND.md)**.

Tin Pata AI is a reading assistant, not a chatbot. It explains a passage the reader has
selected in the PDF reader, in the language and style they choose.

## Request path

```text
Web PDF Reader (text-layer selection)
      ↓  structured intent, selected text only
Tin Pata AI client  (tin-pata-web/services/AIService.ts)
      ↓  HTTPS + user's Supabase access token
Tin Pata backend  (backend/ — POST /api/ai/explain)
      ↓  OPENAI_API_KEY (server-side secret, VPS .env only)
OpenAI Responses API  (structured outputs, JSON schema)
      ↓  validated, schema-shaped explanation
Explanation panel  (tin-pata-web/components/ai/ExplanationPanel.tsx)
```

The backend is the **only** place that holds an OpenAI key. The browser, the
Next.js server, and the Expo app never call OpenAI directly and never see the key.

## Why a dedicated backend and not a Next.js route

The web app already has a Gemini-backed summary route (`/api/summaries`), which only web
can reach. The AI gateway is deliberately outside Next.js so the Expo app can call the
same endpoint with the same auth in a later phase.

It is also outside Supabase Edge Functions, which is where v2.2A started. A long-lived
Node service is a better fit for what comes next — RAG over book text, PDF text
extraction, embeddings, and background jobs — none of which sit comfortably in a
per-request edge isolate.

## Backend layout

```text
backend/src/
  routes/ai.routes.ts             POST /api/ai/explain
  middleware/auth.middleware.ts   verify the caller's Supabase token
  middleware/rate-limit.*.ts      per-user quota
  schemas/ai.schema.ts            mode allowlist, size limits, text normalization
  prompts/explain-text.prompt.ts  role, safety rules, per-mode instructions
  schemas/explain-response.*.ts   JSON schema + parser that strips nulls
  services/openai.service.ts      the only file that knows about OpenAI
  services/ai-usage.service.ts    token/latency telemetry
  types/ai.ts                     shared contract (mirrored in tin-pata-web/types/ai.ts)
```

`tin-pata-web/types/ai.ts` mirrors `types.ts` by hand — Deno and Next.js cannot import
across the boundary. **Change both files together.**

## Authentication

* `verify_jwt = true` (`supabase/config.toml`) makes the platform reject unsigned calls.
* The function then calls `GET /auth/v1/user` with the caller's token and derives the
  user id from the result. A publishable/anon key presented as a bearer token passes the
  platform gate but has no `sub` claim, so it is rejected here.
* `user_id` is **never** read from the request body.
* No OpenAI call happens before authentication succeeds.
* Missing or invalid auth → `401 { error: { code: "unauthorized" } }`.

## Actions

v2.2A supports exactly one action:

```ts
{ action: "explain_text", text, mode, context?: { bookId?, bookTitle?, pageNumber? } }
```

The frontend sends structured intent only. There is no field through which a client can
supply a prompt, a system message, or a model name.

Future actions (`summarize_notes`, `session_recap`, `summarize_pages`, `ask_book`) plug
into the same gateway and reuse `openai.ts`. None of them are implemented.

## Explanation modes

| Mode | Output |
| --- | --- |
| `simple_english` | Easier-English rewrite + explanation + 2–5 vocabulary items |
| `very_simple_english` | Short sentences, common words, for hard passages |
| `bangla` | Explained in Bangla — meaning, not literal translation; English terms kept and glossed |
| `english_bangla` | English explanation + Bangla explanation + vocabulary in both |
| `vocabulary` | 3–10 difficult terms: simple meaning, Bangla meaning, meaning *here* |
| `sentence_by_sentence` | Each sentence in order: original, simple explanation, Bangla gloss |

The mode allowlist lives in `EXPLANATION_MODES`; anything else is rejected before OpenAI
is called.

## Structured output

The Responses API is called with `text.format = { type: "json_schema", strict: true }`.
Strict mode requires every property to be listed in `required`, so "optional" fields are
modelled as nullable and the nulls are stripped server-side. The client therefore renders
from presence alone and never parses markdown.

```ts
interface ExplainTextResponse {
  action: 'explain_text';
  mode: ExplanationMode;
  mainIdea: string;
  explanation: string;
  simpleEnglish?: string;        // English modes only
  banglaExplanation?: string;    // english_bangla only
  vocabulary: VocabularyItem[];
  sentenceBreakdown?: SentenceExplanation[];
}
```

Reasoning traces are never requested, returned, or rendered.

## Prompt-injection safety

The selected passage is untrusted document content:

* The instructions state that the passage is data, that no instruction inside it may be
  followed, and that nothing in it can change the role, task, language, or output format.
* The passage is wrapped in per-request nonce delimiters, so text inside it cannot close
  the block and impersonate the surrounding instructions.
* `tools: []` — no web search, no file search, no code execution, no external tools.

## Cost controls

| Control | Value |
| --- | --- |
| Max selected text | `MAX_EXPLAIN_TEXT_CHARS` = 12,000 characters |
| Min selected text | `MIN_EXPLAIN_TEXT_CHARS` = 12 characters (shorter → use the dictionary) |
| Max request body | 256 KB, rejected before parsing |
| Output ceiling | 2,000–3,200 tokens depending on mode |
| Target length | ~150–400 words; vocabulary mode stays compact |
| Reasoning effort | `low` by default (`OPENAI_EXPLAIN_REASONING_EFFORT`) |
| Conversation history | None — every request is independent, including Regenerate |
| Soft rate guard | 20 requests / 5 min per user, per edge isolate |
| Client guard | Oversized/undersized selections fail locally, with no round trip |

Oversized selections are **rejected with a message**, never silently truncated.

## Privacy

* Only the selected passage is sent. Never the whole PDF, never notes, never other books.
* `bookTitle` and `pageNumber` are optional context; `bookId` is only used for telemetry
  correlation and is not sent to OpenAI.
* `store: false` on the OpenAI request — no server-side response retention there.
* The passage is never persisted by Tin Pata, and never written to a log line.
* Server logs contain outcome, mode, latency, model, and token counts only.
* `ai_usage_events` stores counts and status — never passage or response text.
* The UI states: *Only the selected text is sent for explanation.*

## Usage logging

`docs/V2_SUPABASE_AI_USAGE_EVENTS.sql` creates `ai_usage_events` with RLS: a user may
read their own rows, and inserts are made with the caller's own JWT so a row can only be
attributed to the authenticated user. Logging is best-effort — a missing table or a failed
insert never fails the reader's request. Set `AI_USAGE_LOGGING=0` to turn it off. No
usage UI exists in v2.2A.

## Web reader integration

* Selection uses the existing PDF.js text layer. The reader was not rewritten and
  `react-pdf`/PDF.js architecture is unchanged.
* A passage-sized selection shows a floating **✨ Explain** chip anchored to the
  selection, dismissed on scroll, resize, Escape, or the next mousedown.
* Word-sized selections are left to the existing dictionary (double-click / right-click).
* Scanned, image-only PDFs already show the reader's "no selectable text" banner. No OCR.
* The panel is non-modal: the PDF stays scrollable and readable beside it.

## Not in v2.2A

Ask This Book, RAG, pgvector, embeddings, whole-PDF or page-range summaries, notes
summaries, session recap, flashcards, quizzes, AI chat history, OCR, PDF text search,
text-to-speech, whole-book translation, and mobile text selection.

## Future mobile

The gateway is client-agnostic: any Supabase-authenticated client can POST the same
`explain_text` intent. The mobile app will need a PDF text-selection UX before it can use
it — that work is deliberately out of scope here.
