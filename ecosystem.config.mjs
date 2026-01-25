// ecosystem.config.mjs
export default {
  apps: [{
    name: "nba-backend",
    script: "./server-production.js",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: 3002
    },
    env_production: {
      NODE_ENV: "production"
    },
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_file: "./logs/combined.log",
    time: true,
    watch: false,
    max_memory_restart: "1G"
  }]
};
