module.exports = {
  apps: [
    {
      name: 'gamenode-api',
      cwd: './server',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: { NODE_ENV: 'production' },
      error_file: '../logs/api-error.log',
      out_file: '../logs/api-out.log',
    },
    {
      name: 'gamenode-client',
      cwd: './client',
      script: 'node_modules/vite/bin/vite.js',
      args: '--host 0.0.0.0 --port 3420',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: { NODE_ENV: 'production' },
      error_file: '../logs/client-error.log',
      out_file: '../logs/client-out.log',
    }
  ]
};
