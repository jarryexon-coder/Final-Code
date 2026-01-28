import express from 'express';

const app = express();

// Add some test routes
app.get('/test', (req, res) => res.json({ test: 'ok' }));

// Import and mount fantasy router
async function check() {
  try {
    console.log('🔍 Checking route mounting...\n');
    
    // Load fantasy routes
    const fantasyModule = await import('./routes/fantasyRoutes.js');
    app.use('/api/fantasy', fantasyModule.default);
    console.log('1. Fantasy router mounted at /api/fantasy');
    
    // Check what Express sees
    console.log('\n2. Express router stack:');
    app._router.stack.forEach((layer, i) => {
      console.log(`   Layer ${i}: ${layer.name || 'route'}`);
      if (layer.name === 'router') {
        console.log(`     Regex: ${layer.regexp}`);
        console.log(`     Test /api/fantasy: ${layer.regexp.test('/api/fantasy')}`);
        console.log(`     Test /api/fantasy/: ${layer.regexp.test('/api/fantasy/')}`);
      } else if (layer.route) {
        console.log(`     Route: ${layer.route.path}`);
      }
    });
    
    // Test the 404 handler logic
    console.log('\n3. Testing 404 handler logic:');
    const mountedPaths = [];
    app._router.stack.forEach(layer => {
      if (layer.name === 'router') {
        // Try different regex extraction methods
        const regexStr = layer.regexp.toString();
        console.log(`   Router regex: ${regexStr}`);
        
        // Method 1: Try to extract path
        const match1 = regexStr.match(/^\^\\\/([^\\\/]+)\\\/([^\\\/]+)/);
        if (match1) {
          mountedPaths.push(`/${match1[1]}/${match1[2]}`);
        }
        
        // Method 2: Try simpler extraction
        const match2 = regexStr.match(/^\^(.*?)(?=\\\/|$)/);
        if (match2) {
          const path = match2[1].replace(/\\\//g, '/');
          mountedPaths.push(path);
        }
      } else if (layer.route) {
        mountedPaths.push(layer.route.path);
      }
    });
    
    console.log(`\n4. Extracted mounted paths:`, [...new Set(mountedPaths)]);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

check();
