/**
 * PM2 Ecosystem Config — AstraMinds production launcher
 *
 * Usage:
 *   npm run build          # compile frontend + server
 *   npm run start:pm2      # launch with PM2
 *   npm run reload:pm2     # zero-downtime reload
 *   npm run logs:pm2       # tail logs
 *   pm2 save               # persist across reboots
 *   pm2 startup            # generate OS startup script
 */

module.exports = {
  apps: [
    {
      name: 'astraminds',
      script: './dist-server/server.js',

      // ── Clustering ──────────────────────────────────────────────
      // 'max' uses all CPU cores; set to a number to cap (e.g. 2).
      instances: process.env.WEB_CONCURRENCY || 'max',
      exec_mode: 'cluster',

      // ── Environment ─────────────────────────────────────────────
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
      },

      // ── Reliability ─────────────────────────────────────────────
      // Auto-restart if the process crashes
      autorestart: true,
      // Restart if memory exceeds 512 MB (tune to your server)
      max_memory_restart: '512M',
      // Exponential back-off between crash restarts (ms)
      restart_delay: 1000,
      // Stop retrying after this many restarts in a short window
      max_restarts: 10,

      // ── Graceful shutdown ────────────────────────────────────────
      // Give in-flight requests up to 10 s to finish before SIGKILL
      kill_timeout: 10000,
      // Listen for SIGINT inside the app to trigger graceful drain
      listen_timeout: 8000,
      shutdown_with_message: false,

      // ── Logs ────────────────────────────────────────────────────
      output: './logs/pm2-out.log',
      error:  './logs/pm2-err.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // ── Watch (dev only — keep off in production) ────────────────
      watch: false,
    },
  ],
};
