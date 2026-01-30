// middleware/performanceMonitor.js
import expressStatusMonitor from 'express-status-monitor';

export const performanceMonitor = expressStatusMonitor({
  title: 'NBA Fantasy API Status',
  path: '/status',
  spans: [
    { interval: 1, retention: 60 }, // 1 minute intervals
    { interval: 5, retention: 60 },
    { interval: 15, retention: 60 }
  ],
  chartVisibility: {
    cpu: true,
    mem: true,
    load: true,
    responseTime: true,
    rps: true,
    statusCodes: true
  },
  healthChecks: [
    {
      protocol: 'http',
      host: 'localhost',
      path: '/health',
      port: process.env.PORT || 3002
    }
  ]
});

// Add to server.js:
// app.use(performanceMonitor);
