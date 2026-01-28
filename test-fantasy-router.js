import express from 'express';

const app = express();

// Load fantasy router
async function test() {
  try {
    const fantasyModule = await import('./routes/fantasyRoutes.js');
    const fantasyRouter = fantasyModule.default;
    
    // Mount it
    app.use('/test-fantasy', fantasyRouter);
    
    // Add a test endpoint to see what's mounted
    app.get('/ping', (req, res) => res.json({ ping: 'pong' }));
    
    // List all routes
    console.log('Fantasy router routes:');
    if (fantasyRouter.stack) {
      fantasyRouter.stack.forEach((layer, i) => {
        if (layer.route) {
          console.log(`  ${i}: ${Object.keys(layer.route.methods)} ${layer.route.path}`);
        }
      });
    }
    
    // Start test server
    const PORT = 3011;
    app.listen(PORT, () => {
      console.log(`\n✅ Test server on port ${PORT}`);
      console.log('Test: http://localhost:3011/test-fantasy');
      console.log('Test: http://localhost:3011/test-fantasy/players');
      console.log('Test: http://localhost:3011/ping');
    });
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log(error.stack);
  }
}

test();
