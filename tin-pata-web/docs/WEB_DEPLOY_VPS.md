# Deploy Tin Pata Web on a VPS

Step-by-step for a typical Ubuntu VPS (1–2 GB RAM is enough for a small app).  
App folder: `tin-pata-web` (Next.js).

## 0. What you need

- A VPS with a public IP (DigitalOcean, Hetzner, Linode, etc.)
- A domain (optional but recommended), DNS A record → VPS IP
- Supabase project already set up (same as mobile/web local)
- SSH access as a user with `sudo`

## 1. Point your domain (optional)

In your DNS provider:

| Type | Name | Value |
|------|------|--------|
| A | `@` (or `app`) | `YOUR_VPS_IP` |

Wait until it resolves (`dig yourdomain.com`).

## 2. Prepare the VPS

```bash
ssh root@YOUR_VPS_IP   # or your sudo user

sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx ufw
```

Install Node.js 20+ (NodeSource example):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Install PM2 (keeps Next.js running):

```bash
sudo npm install -g pm2
```

Firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 3. Clone the project

```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone YOUR_REPO_URL Read_Book
cd Read_Book/tin-pata-web
npm ci
```

If the repo is private, use a deploy key or HTTPS token.

## 4. Create production env file

```bash
nano /var/www/Read_Book/tin-pata-web/.env.production
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# or: NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Rules:

- Use the same Supabase project as mobile
- Never put the **service role** key here
- Rebuild after any env change (`npm run build`)

Also in **Supabase Dashboard → Authentication → URL configuration**, add:

- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/**` and `https://yourdomain.com/auth/reset-password`

## 5. Build

```bash
cd /var/www/Read_Book/tin-pata-web
npm run build
```

## 6. Run with PM2

```bash
cd /var/www/Read_Book/tin-pata-web
pm2 start npm --name tin-pata-web -- start
pm2 save
pm2 startup
# run the command PM2 prints (sudo env PATH=...)
```

App listens on **http://127.0.0.1:3000** by default.

Useful commands:

```bash
pm2 status
pm2 logs tin-pata-web
pm2 restart tin-pata-web
```

## 7. Nginx reverse proxy

```bash
sudo nano /etc/nginx/sites-available/tin-pata-web
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 25m;  # PDF upload ≤ 20MB
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/tin-pata-web /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 8. HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot renews automatically. Test:

```bash
sudo certbot renew --dry-run
```

## 9. Verify

1. Open `https://yourdomain.com`
2. Sign in
3. Library → Upload PDF
4. Open reader

## 10. Updating later

```bash
cd /var/www/Read_Book
git pull
cd tin-pata-web
npm ci
npm run build
pm2 restart tin-pata-web
```

## Notes / troubleshooting

| Issue | Fix |
|-------|-----|
| 502 Bad Gateway | `pm2 status` — is `tin-pata-web` online? |
| Auth redirect fails | Add production URLs in Supabase Auth settings |
| Upload fails | Check `client_max_body_size` and Storage RLS for `user-pdfs` |
| Env not applied | Env is baked at **build** time for `NEXT_PUBLIC_*` — rebuild |
| OOM on build | Use a 2GB+ VPS or build on your PC and copy `.next` (advanced) |

## Alternative: Docker (optional)

If you prefer containers, run Next behind Nginx/Caddy with the same env vars and `node server.js` / `npm start` after `npm run build`. PM2 + Nginx above is the simplest path for a single VPS.
