// diagnose.js - Find out why routes aren't working
import express from 'express';

const app = express();

// Mock test
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Try loading the routes
async function diagnose() {
  console.log('🔍 Route Loading Diagnosis\n');
  
  // Load fantasyRoutes
  try {
    console.log('1. Importing fantasyRoutes.js...');
    const fantasyModule = await import('./routes/fantasyRoutes.js');
    console.log('   ✅ Imported successfully');
    console.log('   Default export type:', typeof fantasyModule.default);
    
    // Mount it
    app.use('/test-fantasy', fantasyModule.default);
    
    // Test immediately
    const testReq = { method: 'GET', url: '/test-fantasy' };
    const testRes = {
      json: (data) => console.log('   Response:', data.message || data)
    };
    
    // Manually trigger the route
    console.log('2. Testing mounted route...');
    app._router.handle(testReq, testRes, () => {
      console.log('   (route handled)');
    });
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Stack:', error.stack);
  }
}

diagnose();
