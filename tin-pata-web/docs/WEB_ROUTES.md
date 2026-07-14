# Tin Pata Web — Routes

Status as of **v2.1E**.

| Route | Purpose | Protection | Status |
|-------|---------|------------|--------|
| `/` | Marketing / home entry | Public | Done |
| `/auth/sign-in` | Email sign in | Public | Done (v2.1B) |
| `/auth/sign-up` | Create account | Public | Done (v2.1B) |
| `/auth/forgot-password` | Request password reset | Public | Done (v2.1B) |
| `/auth/reset-password` | Set new password | Public (recovery) | Done (v2.1B) |
| `/dashboard` | Home overview shell | Protected | Shell (v2.1C) |
| `/dashboard/library` | Library management | Protected | Done (v2.1D) |
| `/dashboard/library/[bookId]` | Book detail | Protected | Done (v2.1D) |
| `/dashboard/reader/[bookId]` | PDF reader | Protected | Done (v2.1E) |
| `/dashboard/reading` | Reading hub | Protected | Links to library |
| `/dashboard/analytics` | Insights | Protected | Placeholder |
| `/dashboard/settings` | Account preferences | Protected | Placeholder |

## Route groups

| Group | Paths | Notes |
|-------|-------|--------|
| `(public)` | `/` | No auth shell |
| `(auth)` | `/auth/*` | Centered auth layout |
| `(dashboard)` | `/dashboard/*` | Sidebar + topbar shell (hidden on reader) |

## Related docs

- [AUTH_FLOW.md](./AUTH_FLOW.md)
- [PROTECTED_ROUTES.md](./PROTECTED_ROUTES.md)
- [WEB_DASHBOARD.md](./WEB_DASHBOARD.md)
- [WEB_LIBRARY.md](./WEB_LIBRARY.md)
- [WEB_READER.md](./WEB_READER.md)
