const express = require('express');
const app = express();

// Simulate your server's route mounting
const analyticsRoutes = require('../routes/analytics');

// Mount the routes
app.use('/api/analytics', analyticsRoutes);

// Function to print all routes
function printRoutes() {
  console.log('📋 Mounted Routes:');
  
  function printRoute(layer) {
    if (layer.route) {
      // Routes registered directly on the app
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(', ');
      console.log(`   ${methods} ${layer.route.path}`);
    } else if (layer.name === 'router' && layer.handle.stack) {
      // Router middleware
      layer.handle.stack.forEach(printRoute);
    } else if (layer.regexp) {
      // Middleware or mounted router
      console.log(`   [Middleware] ${layer.name || 'anonymous'}`);
    }
  }
  
  app._router.stack.forEach(printRoute);
}

printRoutes();
