module.exports = {
  apps: [
    {
      name: 'whatsapp-api',
      script: '/var/www/apps/whatsapp-api/index.js',
      cwd: '/var/www/apps/whatsapp-api',
      env: {
        NODE_ENV: 'production',
        PORT: 3333
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      error_file: '/var/log/pm2/whatsapp-api-error.log',
      out_file: '/var/log/pm2/whatsapp-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
  