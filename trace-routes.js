import express from 'express';

const app = express();

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// Try to load and mount fantasyRoutes
async function trace() {
  console.log('🔍 Tracing route loading...\n');
  
  try {
    // Load the route
    const module = await import('./routes/fantasyRoutes.js');
    console.log('1. ✅ fantasyRoutes.js imported');
    
    // Mount it
    app.use('/api/fantasy', module.default);
    console.log('2. ✅ Mounted at /api/fantasy');
    
    // Check what's in the router stack
    console.log('\n3. Router stack analysis:');
    console.log('   Total layers:', app._router.stack.length);
    
    const routers = app._router.stack.filter(layer => layer.name === 'router');
    console.log('   Routers found:', routers.length);
    
    routers.forEach((router, i) => {
      console.log(`   Router ${i}:`);
      console.log(`     Path regex: ${router.regexp}`);
      if (router.handle && router.handle.stack) {
        console.log(`     Routes in router: ${router.handle.stack.length}`);
        router.handle.stack.forEach((route, j) => {
          if (route.route) {
            console.log(`       Route ${j}: ${Object.keys(route.route.methods)} ${route.route.path}`);
          }
        });
      }
    });
    
    // Start server to test
    app.listen(3005, () => {
      console.log('\n✅ Test server on port 3005');
      console.log('   Test: curl http://localhost:3005/api/fantasy');
    });
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log(error.stack);
  }
}

trace();
