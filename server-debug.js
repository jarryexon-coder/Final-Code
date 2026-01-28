// Temporary debug version of server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
// ... other imports ...

const app = express();

// ... middleware setup ...

// Enhanced loadRoutes function with detailed debugging
async function loadRoutes() {
  const routesToLoad = [
    { path: '/api/fantasy', file: 'fantasyRoutes.js', name: 'Fantasy Routes' },
    { path: '/api/picks', file: 'picks.js', name: 'Picks Routes' },
    { path: '/api/news', file: 'news.js', name: 'News Routes' },
  ];

  console.log('\n🔍 DEBUGGING ROUTE LOADING:\n');

  for (const route of routesToLoad) {
    console.log(`\n📦 Loading ${route.name} (${route.file})...`);
    
    try {
      // Try to import the module
      console.log(`  1. Attempting import...`);
      const module = await import(`./routes/${route.file}`);
      console.log(`  2. Import successful`);
      
      // Check what was imported
      console.log(`  3. Module keys:`, Object.keys(module));
      
      if (module.default) {
        console.log(`  4. ✅ Has default export, type:`, typeof module.default);
        
        if (typeof module.default === 'function') {
          console.log(`  5. Mounting at ${route.path}...`);
          app.use(route.path, module.default);
          console.log(`  6. ✅ Successfully mounted ${route.name}`);
        } else {
          console.log(`  5. ❌ Default export is not a function:`, module.default);
        }
      } else {
        console.log(`  4. ❌ No default export found`);
        console.log(`     Available exports:`, Object.keys(module));
      }
      
    } catch (error) {
      console.log(`  ❌ Import failed:`, error.message);
      console.log(`     Stack:`, error.stack.split('\n')[1]);
    }
  }
  
  // Test the routes after loading
  console.log('\n🧪 TESTING LOADED ROUTES:');
  console.log('   app._router.stack has', app._router.stack.length, 'layers');
  
  // Find mounted routers
  const routers = app._router.stack.filter(layer => layer.name === 'router');
  console.log(`   Found ${routers.length} routers mounted`);
  
  routers.forEach((router, i) => {
    console.log(`   Router ${i}: regexp=${router.regexp}`);
    if (router.handle && router.handle.stack) {
      console.log(`     Has ${router.handle.stack.length} routes`);
    }
  });
}

// Start the server
app.get('/', (req, res) => res.json({ message: 'Debug server' }));

loadRoutes().then(() => {
  app.listen(3003, () => {
    console.log('\n✅ Debug server running on port 3003');
    console.log('   Test endpoints:');
    console.log('   http://localhost:3003/api/fantasy');
    console.log('   http://localhost:3003/api/picks');
    console.log('   http://localhost:3003/api/news');
  });
});
