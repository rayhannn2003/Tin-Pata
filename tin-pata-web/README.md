# Tin Pata Web

Next.js web client for [Tin Pata](../README.md) — shares the Supabase backend with the Android app.

**Version:** v2.1A (architecture foundation only)

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run format` | Prettier write |

## Documentation

- [WEB_ARCHITECTURE.md](docs/WEB_ARCHITECTURE.md)
- [WEB_SETUP.md](docs/WEB_SETUP.md)
- [WEB_ROUTES.md](docs/WEB_ROUTES.md)

## Phase scope

v2.1C adds the dashboard shell (sidebar, top bar, placeholder home cards). Auth is from v2.1B. **No library queries or reader yet.**

See [docs/WEB_DASHBOARD.md](docs/WEB_DASHBOARD.md).

## Auth URLs

Configure Supabase redirect URLs to include:

- `http://localhost:3000/auth/reset-password`
- `https://YOUR_DOMAIN/auth/reset-password`
