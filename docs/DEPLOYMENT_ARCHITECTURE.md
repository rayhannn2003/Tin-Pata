# Deployment Architecture

Tin Pata is one repository with three independently deployed applications. Each has
its own pipeline. A push that touches only one of them runs only that pipeline.

```
                        GitHub (rayhannn2003/Tin-Pata)
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
  web-deploy.yml              backend-deploy.yml          android-release.yml
  push main                   push main                   tag v* / manual
  paths: tin-pata-web/**      paths: backend/**           (no VPS access)
        │                            │                            │
        ▼                            ▼                            ▼
   VPS :3015                    VPS :3016                  GitHub Release
   pm2 tin-pata-web             pm2 tin-pata-api           tin-pata-vX.Y.Z-arm64.apk
   book.daftar-e.com            api.book.daftar-e.com      (or Actions artifact)
```

## Repository layout

```
Read_Book/
├── app/  src/  app.json        Expo mobile app (repo root)
├── tin-pata-web/               Next.js web app
├── backend/                    Tin Pata API (Node + Express)
├── docs/
└── .github/workflows/
    ├── web-deploy.yml
    ├── backend-deploy.yml
    └── android-release.yml
```

Path filters keep the pipelines independent — a backend change never rebuilds the
APK, a web change never reloads the API. The Android workflow has no VPS credentials
at all and never deploys anywhere.

## Runtime architecture

```
Web ────────┐
            ├──► Tin Pata Backend ──► OpenAI      (AI only; holds the API key)
Mobile ─────┤
            └──► Supabase directly  (auth, Postgres + RLS, Storage, sync)
```

Hybrid on purpose: the backend is a trusted layer for operations needing a server
secret, a server-owned prompt, or a rate limit. Everything else stays on Supabase and
its RLS. See [AI_BACKEND.md](AI_BACKEND.md).

## Branches

| Branch / ref | Effect |
|---|---|
| `main` | Production web and backend deploys (path-filtered) |
| `staging` | No automatic deployment configured |
| `v*` tag | Android GitHub Release |
| manual dispatch | Any pipeline; Android uploads an artifact instead of releasing |

## Safety properties

Both server pipelines:

- build and verify **before** anything is uploaded — a failing lint, typecheck, test
  or build never reaches the server;
- upload into a fresh `releases/<git-sha>/` directory and only then flip the `current`
  symlink, so production is never half-replaced;
- reload exactly one named PM2 process — never `pm2 restart all`, never an unrelated
  app, never a Docker container;
- never write the server's `.env`; secrets live in `shared/.env` and are symlinked in;
- health-check after reload (5 attempts, 5s apart) and roll the symlink back on
  failure;
- keep the last 5 releases, never pruning whatever `current` points at;
- use `concurrency` groups so two production deploys cannot interleave.

Neither pipeline touches Nginx. See [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md).

## Secrets

`OPENAI_API_KEY` exists **only** in `/var/www/tin-pata-api/shared/.env` on the VPS.
It is not a GitHub secret, not a build variable, and not in any bundle. The web and
Android workflows each have a step that fails the build if a server-only secret
appears in their output.

Required GitHub secrets are listed in [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md) and
[ANDROID_RELEASE.md](ANDROID_RELEASE.md).
