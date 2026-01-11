#!/bin/bash
# Create a better health check endpoint
cat > /tmp/health_fix.js << 'HEALTHFIX'
// Replace the entire health check endpoint
const newHealthCheck = `
app.get('/health', async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus = mongoState === 1 ? 'connected' : 'disconnected';
  
  // Test MongoDB with simple query
  let mongoTest = 'error';
  try {
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      mongoTest = 'ok';
    }
  } catch (error) {
    mongoTest = 'ping_failed: ' + error.message;
  }
  
  const redisStatus = req.redis?.status === 'ready' ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'healthy',
    service: 'NBA Fantasy AI Backend',
    version: '4.2.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    databases: {
      mongodb: mongoStatus,
      mongodb_state: mongoState, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
      mongoTest: mongoTest,
      redis: redisStatus
    },
    process: {
      pid: process.pid,
      platform: process.platform,
      node: process.version
    }
  });
});
`;

# Now replace in server.js
awk -v replacement="$newHealthCheck" '
  /app.get.*health.*async.*req.*res.*{/,/^\s*}\);/ {
    if (!found) {
      print replacement;
      found = 1;
    }
    next
  }
  { print }
' server.js > server.js.new && mv server.js.new server.js

echo "Health check endpoint updated"
HEALTHFIX

chmod +x /tmp/health_fix.js
node /tmp/health_fix.js
