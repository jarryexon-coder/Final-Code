// ecosystem.config.cjs - Use .cjs extension for CommonJS
module.exports = {
  apps: [{
    name: 'nba-backend',
    script: 'server.js',  // Make sure this is correct
    cwd: '/Users/jerryexon/sports-app-production/nba-backend',
    instances: 1,  // Start with 1, then scale up
    exec_mode: 'fork',  // Use fork first, then cluster
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
