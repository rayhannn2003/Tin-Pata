# VPS Deployment

Server state below was read from the live host, not assumed.

| | Web | Backend |
|---|---|---|
| Domain | `book.daftar-e.com` | `api.book.daftar-e.com` *(to create)* |
| PM2 process | `tin-pata-web` | `tin-pata-api` |
| Port | `127.0.0.1:3015` | `127.0.0.1:3016` |
| Deploy path | `/var/www/book.daftar-e.com` | `/var/www/tin-pata-api` |
| Health | `https://book.daftar-e.com/` | `https://api.book.daftar-e.com/health` |

The VPS also hosts unrelated apps (`daftare-backend`, `sokherghor-api`,
`schools-portfolio`) and other Nginx sites. **Nothing in this document touches
them.** Deploys reload one named PM2 process, never `pm2 restart all`.

## Current state vs target

The web app is currently deployed **in place**: files sit directly in
`/var/www/book.daftar-e.com`, PM2's `cwd` points there, and it is not a git
checkout. Updating means overwriting a live directory — a failed copy leaves the
site half-replaced.

Target for both apps is a release-directory layout:

```
/var/www/<app>/
  releases/
    <git-sha>/          ← a complete, verified build
  current -> releases/<git-sha>
  shared/
    .env                ← secrets; never uploaded, never overwritten by CI
  PREVIOUS_RELEASE      ← written on each deploy, used by rollback
```

Nothing is switched until the release is complete, rollback is a symlink swap, and
the last 5 releases are kept.

## 1. Deploy user

CI must not use the root SSH key. Create a dedicated user:

```bash
# As root on the VPS
adduser --disabled-password --gecos "" deploy
```

Generate a key **on your machine** (never on the server, never reuse `my_vps_key`):

```bash
ssh-keygen -t ed25519 -C "github-actions-tinpata" -f ~/.ssh/tinpata_deploy
```

Install the public half:

```bash
# As root on the VPS
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
cat >> /home/deploy/.ssh/authorized_keys <<'KEY'
ssh-ed25519 AAAA...   github-actions-tinpata
KEY
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

The **private** half goes into the GitHub secret `VPS_SSH_KEY`. It never leaves
GitHub and your machine.

### Directory ownership

```bash
# As root
mkdir -p /var/www/tin-pata-api/{releases,shared}
chown -R deploy:deploy /var/www/tin-pata-api

# Hand the existing web directory to deploy as well
mkdir -p /var/www/book.daftar-e.com/{releases,shared}
chown -R deploy:deploy /var/www/book.daftar-e.com
```

`deploy` owns exactly these two trees and nothing else.

### PM2 ownership — read this before deploying

PM2 is **per-user**. The four processes on this box currently run under **root's**
PM2 daemon. `pm2 reload tin-pata-web` run as `deploy` would talk to *deploy's* empty
daemon and silently do nothing useful.

Pick one:

**Option A — move the Tin Pata processes to the `deploy` daemon (recommended).**
Clean separation, no sudo at all. Costs a few seconds of downtime for the web app.

```bash
# As root: stop and forget the old process
pm2 delete tin-pata-web
pm2 save

# As deploy: start it from the release layout (after step 2 below)
su - deploy
pm2 start /var/www/book.daftar-e.com/current/ecosystem.config.cjs
pm2 save
exit

# As root: make deploy's PM2 survive reboot; run the command it prints
env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

**Option B — keep PM2 under root, give `deploy` two exact sudo commands.**
No downtime, but `deploy` can invoke root for those commands.

```bash
# As root: visudo -f /etc/sudoers.d/tinpata-deploy
deploy ALL=(root) NOPASSWD: /usr/local/bin/pm2 reload tin-pata-web --update-env
deploy ALL=(root) NOPASSWD: /usr/local/bin/pm2 reload tin-pata-api --update-env
```

```bash
chmod 440 /etc/sudoers.d/tinpata-deploy
visudo -c   # must print "parsed OK"
```

With Option B, prefix the reload commands in both workflows with `sudo`. No wildcards
— `deploy` cannot reload any other app, and cannot run any other root command.

## 2. Migrate the web app to the release layout

One time, and reversible. Do it when a few seconds of downtime is acceptable.

```bash
su - deploy
cd /var/www/book.daftar-e.com

# Preserve the live build as the first release
SHA=$(date +%Y%m%d%H%M%S)-preexisting
mkdir -p releases/$SHA
# Move the app files (not releases/, shared/, or node_modules) into it
for f in .next public package.json package-lock.json next.config.ts app components \
         lib services types utils hooks styles middleware.ts node_modules; do
  [ -e "$f" ] && mv "$f" "releases/$SHA/" || true
done

# Secrets move to shared/ and are symlinked back in
mv .env.production shared/.env.production
ln -sfn /var/www/book.daftar-e.com/shared/.env.production \
        releases/$SHA/.env.production

ln -sfn /var/www/book.daftar-e.com/releases/$SHA current
ls -l current
```

Then start it under the new `cwd` (Option A above), and confirm
`https://book.daftar-e.com` still loads **before** pushing anything.

Rollback if it goes wrong: the old files are all inside `releases/$SHA` — move them
back up one level and re-point PM2's `cwd`.

## 3. Backend first deploy (manual, once)

CI expects `shared/.env` to already exist — it never creates or overwrites secrets.

```bash
su - deploy
mkdir -p /var/www/tin-pata-api/{releases,shared}
nano /var/www/tin-pata-api/shared/.env      # from backend/.env.example
chmod 600 /var/www/tin-pata-api/shared/.env
```

Then build and start it once by hand (from your machine):

```bash
cd backend
npm ci && npm run build
rsync -avz --delete dist package.json package-lock.json ecosystem.config.cjs \
  deploy@31.97.224.20:/var/www/tin-pata-api/releases/manual-001/

ssh deploy@31.97.224.20 '
  cd /var/www/tin-pata-api/releases/manual-001 &&
  npm ci --omit=dev &&
  ln -sfn /var/www/tin-pata-api/shared/.env .env &&
  ln -sfn /var/www/tin-pata-api/releases/manual-001 /var/www/tin-pata-api/current &&
  pm2 start /var/www/tin-pata-api/current/ecosystem.config.cjs &&
  pm2 save'
```

Verify before wiring CI:

```bash
ssh deploy@31.97.224.20 'curl -s http://127.0.0.1:3016/health'
# {"status":"ok","service":"tin-pata-api",...,"dependencies":{"supabase":true,"openai":true}}
```

If `dependencies` shows `false`, `shared/.env` is missing a value.

## 4. Nginx for the backend

A **new** vhost. Existing sites are untouched.

```bash
# As root
cat > /etc/nginx/sites-available/api.book.daftar-e.com <<'CONF'
server {
    listen 80;
    server_name api.book.daftar-e.com;

    location / {
        proxy_pass http://127.0.0.1:3016;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # AI calls can take up to 60s; outlast the app's own timeout.
        proxy_read_timeout 90s;
        proxy_send_timeout 90s;
    }

    client_max_body_size 1m;   # a passage, not a file upload
}
CONF

ln -s /etc/nginx/sites-available/api.book.daftar-e.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

DNS first: an `A` record for `api.book.daftar-e.com` → `31.97.224.20`. Then TLS:

```bash
certbot --nginx -d api.book.daftar-e.com
```

CI never touches Nginx. Change it only when the config actually changes, and always
`nginx -t` before reloading.

## 5. Health checks and rollback

Both deploy workflows poll their health URL 5 times, 5 seconds apart, and fail the
deployment if all five fail. On any failure the `Roll back on failure` step restores
`current` to the path in `PREVIOUS_RELEASE` and reloads that one PM2 process.

Manual rollback:

```bash
ssh deploy@31.97.224.20
BASE=/var/www/tin-pata-api          # or /var/www/book.daftar-e.com
ls -1dt $BASE/releases/*/ | head -5 # pick the release you want
ln -sfn $BASE/releases/<sha> $BASE/current
pm2 reload tin-pata-api --update-env
curl -s https://api.book.daftar-e.com/health
```

The last 5 releases are kept; the pruning step never deletes whatever `current`
points at.

## Troubleshooting

| Symptom | Check |
|---|---|
| 502 from Nginx | `pm2 list` — is the process online? `pm2 logs tin-pata-api --lines 50` |
| `/health` says `openai: false` | `shared/.env` missing `OPENAI_API_KEY`; it is read at startup, so reload after editing |
| Deploy succeeded, old code still served | PM2 `cwd` still points at a release dir instead of `current` |
| `pm2 reload` does nothing | Wrong PM2 daemon — see *PM2 ownership* above |
| 401 from every AI request | `SUPABASE_URL` / `SUPABASE_ANON_KEY` wrong in `shared/.env` |
| CORS error in browser | Origin missing from `AI_ALLOWED_ORIGINS` |

## GitHub secrets

Repository → Settings → Secrets and variables → Actions. The two deploy jobs use the
`production` environment, so these can live there instead if you want approval gates.

### Shared (web + backend)

| Secret | Example | Notes |
|---|---|---|
| `VPS_HOST` | `31.97.224.20` | |
| `VPS_PORT` | `22` | Optional; defaults to 22 |
| `VPS_USER` | `deploy` | **Not** `root` |
| `VPS_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----…` | Private half of the deploy key, full contents |

### Web

| Secret | Example |
|---|---|
| `WEB_DEPLOY_PATH` | `/var/www/book.daftar-e.com` |
| `WEB_HEALTH_URL` | `https://book.daftar-e.com/` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ…` (or leave empty if using the publishable key) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |
| `NEXT_PUBLIC_API_URL` | `https://api.book.daftar-e.com` |

`NEXT_PUBLIC_*` values are inlined into the client bundle at build time. They are
public by definition — only ever put non-secret values here.

### Backend

| Secret | Example |
|---|---|
| `BACKEND_DEPLOY_PATH` | `/var/www/tin-pata-api` |
| `BACKEND_HEALTH_URL` | `https://api.book.daftar-e.com/health` |

The backend needs **no application secrets in GitHub**. `OPENAI_API_KEY`,
`SUPABASE_URL` and `SUPABASE_ANON_KEY` live only in `/var/www/tin-pata-api/shared/.env`
on the server, which CI reads-never and writes-never.

### Android

| Secret | Example |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |
| `EXPO_PUBLIC_API_URL` | `https://api.book.daftar-e.com` |

`EXPO_PUBLIC_*` is embedded in the APK and readable by anyone who installs it.

### Never store in GitHub

```
OPENAI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
the root SSH key
the contents of any server .env=
```
