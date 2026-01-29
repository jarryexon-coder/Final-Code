import express from 'express';
const app = express();

// Add a test route
app.get('/api/test', (req, res) => {
  res.json({ test: 'works' });
});

// List all routes
console.log('🔍 Routes in app:');
app._router.stack.forEach((layer, i) => {
  if (layer.route) {
    console.log(`  ${i}. ${Object.keys(layer.route.methods)} ${layer.route.path}`);
  } else if (layer.name === 'router') {
    console.log(`  ${i}. Router middleware`);
  } else if (layer.name) {
    console.log(`  ${i}. Middleware: ${layer.name}`);
  }
});

// Test the route
const testReq = { method: 'GET', url: '/api/test' };
const testRes = {
  json: (data) => console.log('✅ Would respond:', data)
};

console.log('\n🔍 Testing route matching...');
app._router.stack.forEach((layer) => {
  if (layer.route && layer.route.path === '/api/test') {
    console.log('✅ Found /api/test route');
  }
});

console.log('\n✅ Test complete');
