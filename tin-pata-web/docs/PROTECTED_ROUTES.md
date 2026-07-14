# Tin Pata Web — Protected Routes (v2.1C)

## Public routes

| Path | Notes |
|------|--------|
| `/` | Marketing home |
| `/auth/sign-in` | Sign in |
| `/auth/sign-up` | Sign up |
| `/auth/forgot-password` | Request reset email |
| `/auth/reset-password` | Set new password (recovery session) |

## Protected routes

Everything under **`/dashboard`**:

| Path | Notes |
|------|--------|
| `/dashboard` | Home shell |
| `/dashboard/library` | Library shell |
| `/dashboard/reading` | Reading shell |
| `/dashboard/analytics` | Analytics shell |
| `/dashboard/settings` | Settings shell |

## Redirect behavior

| Condition | Result |
|-----------|--------|
| Guest visits `/dashboard…` | → `/auth/sign-in?redirect={path}` |
| Signed-in user visits `/auth/sign-in` or `/auth/sign-up` | → `/dashboard` |
| Signed-in user visits `/auth/reset-password` | Allowed (password recovery) |

## Middleware responsibilities

File: `lib/supabase/middleware.ts`

1. Cookie-aware Supabase client + `auth.getUser()`.
2. Redirect guests from `/dashboard` (and nested paths).
3. Redirect signed-in users away from sign-in / sign-up / forgot-password.
4. Leave static assets unmatched.

`DashboardLayout` also waits for `AuthProvider.loading` to avoid chrome flicker before session restore.
