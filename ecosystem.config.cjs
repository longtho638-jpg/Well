// PM2 ecosystem config for WellNexus SPA (production static serving)
// Requires: npm install -g serve
'use strict';

module.exports = {
  apps: [
    {
      name: 'wellnexus',
      script: 'serve',
      args: ['dist', '--listen', '3000', '--single'],
      interpreter: 'none',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      autorestart: true,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
    },
  ],
};
