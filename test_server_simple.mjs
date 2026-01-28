import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testServer() {
  console.log('🧪 Testing server configuration...\n');
  
  // Test 1: Check environment
  console.log('1. Environment check:');
  console.log(`   PORT: ${process.env.PORT || 3002}`);
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  
  // Test 2: Check route files
  console.log('\n2. Route files check:');
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const routesDir = path.join(__dirname, 'routes');
  const requiredRoutes = ['players', 'teams', 'games', 'auth', 'admin', 'secret-phrases', 'analytics', 'betting', 'predictions'];
  
  for (const route of requiredRoutes) {
    const routeFile = path.join(routesDir, `${route}.js`);
    if (fs.existsSync(routeFile)) {
      console.log(`   ✅ ${route}.js exists`);
    } else {
      console.log(`   ❌ ${route}.js missing`);
    }
  }
  
  // Test 3: Check server.js syntax
  console.log('\n3. Server.js syntax check:');
  const serverFile = path.join(__dirname, 'server.js');
  if (fs.existsSync(serverFile)) {
    const content = fs.readFileSync(serverFile, 'utf8');
    
    // Check for common issues
    const issues = [];
    
    if (content.includes('livegames.backup')) {
      issues.push('Contains "livegames.backup" (corrupted)');
    }
    
    if (!content.includes('app.listen')) {
      issues.push('Missing app.listen()');
    }
    
    if (!content.includes('mongoose.connect')) {
      issues.push('Missing mongoose.connect()');
    }
    
    if (issues.length === 0) {
      console.log('   ✅ Server.js looks good');
    } else {
      console.log('   ⚠ Issues found:');
      issues.forEach(issue => console.log(`     - ${issue}`));
    }
  } else {
    console.log('   ❌ server.js not found');
  }
  
  // Test 4: Try to start a minimal server
  console.log('\n4. Testing minimal server startup:');
  try {
    const app = express();
    app.get('/test', (req, res) => {
      res.json({ message: 'Test server working' });
    });
    
    const testServer = app.listen(0, () => {
      console.log('   ✅ Express server can start');
      testServer.close();
      
      // Test 5: Database connection
      console.log('\n5. Testing database connection:');
      mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
          console.log('   ✅ Database connection successful');
          return mongoose.connection.db.admin().ping();
        })
        .then(() => {
          console.log('   ✅ Database ping successful');
          mongoose.disconnect();
          console.log('\n🎉 All tests passed! Server is ready to start.');
          process.exit(0);
        })
        .catch(err => {
          console.log(`   ❌ Database error: ${err.message}`);
          process.exit(1);
        });
    });
    
  } catch (error) {
    console.log(`   ❌ Server startup failed: ${error.message}`);
    process.exit(1);
  }
}

testServer().catch(console.error);
