# Tin Pata Web — Architecture (v2.1A)

Second client for the Tin Pata reading platform. Uses the **same Supabase project and schema** as the Android app. No backend redesign in this phase.

## Folder structure

```text
tin-pata-web/
  app/                 Route groups and pages (App Router)
  components/          UI, layout, providers, common
  lib/supabase/        Browser, server, middleware clients
  services/            Data access (skeletons in v2.1A)
  hooks/               React hooks (placeholders)
  types/               Shared TypeScript interfaces
  utils/               Pure helpers
  styles/              Design tokens
  docs/                Web documentation
```

## Layer responsibilities

| Layer | Role |
|-------|------|
| **app/** | Routing, layouts, thin page components |
| **components/** | Reusable UI; no Supabase calls in ui/ |
| **lib/supabase/** | Supabase client creation only |
| **services/** | Supabase queries and domain logic (later) |
| **hooks/** | Client state and data fetching (later) |
| **types/** | Shapes aligned with mobile + Supabase tables |

Pages should not contain business logic — delegate to services and hooks in later phases.

## Rendering strategy

- **Public routes** `(public)/` — static/marketing home; no auth required.
- **Auth routes** `(auth)/` — sign-in/up shells; forms in v2.1B.
- **Protected routes** `(protected)/` — dashboard, library, books, settings; guard in v2.1B.
- **Server Components** by default; client components only for interactivity and providers.
- **Middleware** refreshes Supabase session cookies; does not redirect yet.

## Service layer

Services (`BookService`, `NoteService`, etc.) return empty stubs in v2.1A. They will call Supabase via the server client or route handlers, respecting RLS and the same conflict rules as mobile.

## Future roadmap

| Phase | Scope |
|-------|--------|
| **v2.1A** | Architecture, Supabase clients, placeholders |
| **v2.1B** | Auth UI, protected layout, session redirects |
| **v2.1C** | Dashboard shell, navigation, placeholder cards |
| **v2.1D** | Library + metadata from Supabase |
| **Later** | Sync parity, AI, analytics |

## Deployment

Target: **Vercel**. Env vars set in Vercel project settings. Same `NEXT_PUBLIC_SUPABASE_*` values as mobile (URL + publishable or anon key).
