// monitoring.js
import os from 'os';

function logServerStatus() {
  const status = {
    timestamp: new Date().toISOString(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
    },
    cpu: os.loadavg(),
    uptime: os.uptime(),
    mongo: mongoose.connection.readyState === 1
  };
  
  console.log('📊 Server Status:', JSON.stringify(status, null, 2));
}

// Log every 5 minutes
setInterval(logServerStatus, 300000);
