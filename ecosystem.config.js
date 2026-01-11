// ecosystem.config.js - ES Module Format for PM2
export default {
  apps: [{
    name: 'nba-backend',
    script: './server.js',
    instances: 2,  // Start with 2 instances instead of 'max' for stability
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3002
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    combine_logs: true,
    merge_logs: true,
    time: true
  }]
};
