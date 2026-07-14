# Tin Pata Web — Authentication Flow (v2.1B)

## Overview

Web auth uses the **same Supabase project** as the Android app. Email/password only in this phase.

## Flows

### Sign up

1. User submits email + password + confirm password on `/auth/sign-up`.
2. `AuthService.signUp` validates input, then calls `supabase.auth.signUp`.
3. If the project has **Confirm email OFF**, a session is returned → redirect to `/dashboard`.
4. If confirmation is ON and no session returns, show “check your email”, then user signs in.

### Sign in

1. User submits credentials on `/auth/sign-in`.
2. `AuthService.signIn` → `signInWithPassword`.
3. On success → redirect to `/dashboard` (or `?redirect=` path).

### Forgot / reset password

1. `/auth/forgot-password` → `resetPasswordForEmail` with `redirectTo = {origin}/auth/reset-password`.
2. User opens email → Supabase recovery → lands on `/auth/reset-password?code=…`.
3. Page exchanges the code for a recovery session, then `updateUser({ password })`.
4. Sign out recovery session → redirect to sign in.

Add `http://localhost:3000/auth/reset-password` (and your Vercel URL) under Supabase → Authentication → URL Configuration → Redirect URLs.

## Session lifecycle

| Event | Behavior |
|-------|----------|
| App load | `AuthProvider` calls `getSession`; `onAuthStateChange` keeps React state in sync |
| Middleware | Calls `getUser()` to refresh cookies; redirects guests away from protected routes |
| Page refresh | Cookies restore the session (SSR-safe via `@supabase/ssr`) |
| Sign out | Clears Supabase session + cookies → `/auth/sign-in` |
| Expired session | Protected middleware redirects to sign in |

## Route protection

See [PROTECTED_ROUTES.md](./PROTECTED_ROUTES.md).

## Components / services

- `services/AuthService.ts` — all auth API calls
- `components/providers/AuthProvider.tsx` — `useAuth` / `useUser`
- `lib/supabase/middleware.ts` — session + redirects
- `components/auth/*` — UI building blocks
