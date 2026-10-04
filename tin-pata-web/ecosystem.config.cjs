/**
 * PM2 process definition for the Tin Pata web app.
 *
 * `cwd` is the `current` symlink rather than a release directory, so `pm2 reload`
 * always serves whichever release is live and a rollback is just a symlink swap.
 *
 * Port 3015 matches the existing Nginx vhost for book.daftar-e.com — changing it
 * here means changing `proxy_pass` there too.
 *
 * NEXT_PUBLIC_* values are already baked into the build by CI; nothing secret is
 * listed here.
 */
module.exports = {
  apps: [
    {
      name: 'tin-pata-web',
      cwd: '/var/www/book.daftar-e.com/current',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 127.0.0.1 -p 3015',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: '3015',
      },
    },
  ],
};
