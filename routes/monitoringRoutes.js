// routes/monitoringRoutes.js
import express from 'express';
import os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';
const execAsync = promisify(exec);

const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "monitoring API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

// Admin-only monitoring endpoints
router.get('/metrics', async (req, res) => {
  // Authentication check
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const metrics = {
    system: {
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      freemem: os.freemem(),
      totalmem: os.totalmem(),
      cpus: os.cpus().length
    },
    process: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
      node: process.version
    },
    database: {
      mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient?.status === 'ready' ? 'connected' : 'disconnected'
    },
    services: {
      websocket: app.locals.wsServer?.getConnectionCount() || 0
    }
  };

  res.json({ success: true, data: metrics });
});

router.get('/logs', async (req, res) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });
  
  try {
    const { lines = 100 } = req.query;
    const { stdout } = await execAsync(`tail -n ${lines} /var/log/nba-backend.log`);
    res.json({ success: true, logs: stdout });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
