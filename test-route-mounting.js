import express from 'express';
const testApp = express();

// Import the auth router
import('./routes/authRoutes.js')
  .then(module => {
    console.log('✅ Auth router imported');
    
    // Mount it
    testApp.use('/api/auth', module.default);
    
    // Check what routes are in the router
    console.log('\n🔍 Routes in auth router:');
    const router = module.default;
    router.stack.forEach((layer, i) => {
      if (layer.route) {
        console.log(`  ${i}. ${Object.keys(layer.route.methods)} ${layer.route.path}`);
      } else if (layer.name === 'router') {
        console.log(`  ${i}. Nested router`);
      }
    });
    
    // Simulate a request
    console.log('\n🔍 Simulating request to /api/auth/register...');
    const req = { url: '/api/auth/register', method: 'GET' };
    const res = {
      json: (data) => console.log('Response:', data)
    };
    
    // Try to find the route
    testApp._router.stack.forEach((middleware) => {
      if (middleware.name === 'router' && middleware.regexp.test('/api/auth/register')) {
        console.log('✅ Router would handle this request');
      }
    });
    
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
