const express = require('express');
const app = express();
const PORT = 3000;

app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Test server is running',
    timestamp: new Date().toISOString(),
    clientIp: req.ip,
    serverIp: req.socket.localAddress,
    serverPort: req.socket.localPort
  });
});

// Listen on ALL interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on ALL interfaces (0.0.0.0:${PORT})`);
  console.log(`   Access via:`);
  console.log(`   - http://localhost:${PORT}/health`);
  console.log(`   - http://127.0.0.1:${PORT}/health`);
  console.log(`   - http://10.0.0.183:${PORT}/health`);
});
