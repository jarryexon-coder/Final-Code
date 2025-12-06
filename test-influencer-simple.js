const express = require('express');
const app = express();

console.log('🔍 Testing influencer route loading...');

try {
  console.log('Attempting to require influencer routes...');
  const influencerRoutes = require('./routes/influencer');
  console.log('✅ Influencer routes required successfully');
  
  // Mount the routes
  app.use('/api/influencer', influencerRoutes);
  
  // Create a simple test server
  const PORT = 3001;
  const server = app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    
    // Test the route
    const http = require('http');
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/api/influencer/health',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response:', data);
        server.close();
        process.exit(0);
      });
    });
    
    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
      server.close();
      process.exit(1);
    });
    
    req.end();
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
