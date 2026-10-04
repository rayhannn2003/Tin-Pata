/**
 * PM2 process definition for the Tin Pata backend.
 *
 * `cwd` is the `current` symlink, not a release directory, so `pm2 reload` always
 * picks up whichever release is live. Secrets are NOT listed here — they come from
 * shared/.env, which is symlinked into each release and read by dotenv-free
 * `--env-file` at start.
 */
module.exports = {
  apps: [
    {
      name: 'tin-pata-api',
      cwd: '/var/www/tin-pata-api/current',
      script: 'dist/server.js',
      node_args: '--env-file=/var/www/tin-pata-api/shared/.env',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      kill_timeout: 10000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
