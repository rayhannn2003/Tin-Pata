# Tin Pata Web — Dashboard Shell (v2.1C)

Layout and reusable UI only. No library data, sync logic, or reader.

## Layout hierarchy

```text
DashboardLayout
├── Sidebar (desktop fixed | mobile drawer)
│   ├── Logo
│   ├── NavItem × 5
│   ├── SyncStatus
│   └── UserMenu (profile + logout)
├── Topbar
│   ├── Menu button (mobile)
│   ├── Greeting + date
│   ├── SyncStatus
│   ├── Notifications placeholder
│   └── UserMenu (dropdown)
└── main → page content
```

## Component tree (`components/dashboard/`)

| Component | Role |
|-----------|------|
| `DashboardLayout` | Auth gate + shell chrome |
| `Sidebar` / `Topbar` | Navigation regions |
| `NavItem` | Active-route aware link |
| `StatCard` / `SectionCard` | Placeholder cards |
| `SyncStatus` | UI states only (`synced` / `syncing` / `offline` / `conflict`) |
| `UserMenu` | Avatar, settings link, logout |
| `DashboardHeader` | Page title block |
| `EmptyState` | Reusable empty slot |
| `Skeleton` | Loading placeholders for future queries |

## Routing

| Path | Page |
|------|------|
| `/dashboard` | Home placeholders (continue reading, goals, notes, …) |
| `/dashboard/library` | Library shell |
| `/dashboard/reading` | Reading shell |
| `/dashboard/analytics` | Analytics shell |
| `/dashboard/settings` | Settings shell |

All live under route group `(dashboard)` and inherit the shell layout. Middleware protects the `/dashboard` prefix (from v2.1B).

## Responsiveness

- **Desktop (lg+):** Fixed 16rem sidebar; content offset with `pl-64`.
- **Mobile:** Sidebar hidden; hamburger opens a single drawer (no duplicated nav).
- Drawer closes on Escape, backdrop click, or nav link press.

## Accessibility

- Semantic `aside`, `nav`, `header`, `main`
- `aria-current="page"` on active nav
- Focus rings on interactive controls
- Drawer `role="dialog"` + labelled close control
- Sync status exposed via `role="status"`

## Future extension points

1. Replace `StatCard` / `SectionCard` placeholders with hooks that call `BookService` / analytics.
2. Drive `SyncStatus` from a real sync context (still mobile-parity metadata sync).
3. Add `/dashboard/library/[bookId]` under the same layout.
4. Swap notification button for a real panel when ready.
5. Skeleton components are ready for Suspense / React Query loading states.

Auth is unchanged — `DashboardLayout` only waits on `useAuth()` and relies on middleware redirects.
