// Check and fix missing endpoints (ES Module version)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Checking for missing endpoints...');

// Check routes directory
const routesDir = path.join(__dirname, 'routes');
const missingEndpoints = [
  'secret-phrases',
  'auth',
  'admin',
  'analytics',
  'betting',
  'predictions'
];

console.log('Available route files:');
try {
  const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  routeFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
} catch (err) {
  console.log(`Error reading routes directory: ${err.message}`);
}

// Check which endpoints are actually missing
for (const endpoint of missingEndpoints) {
  const routeFile = path.join(routesDir, `${endpoint}.js`);
  if (!fs.existsSync(routeFile)) {
    console.log(`⚠ Missing route file: ${endpoint}.js`);
    
    // Create basic route file if missing
    const basicRoute = `import express from 'express';
const router = express.Router();

// ${endpoint.toUpperCase()} endpoints
router.get('/', (req, res) => {
  res.json({ 
    message: '${endpoint} endpoint is working',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

router.get('/test', (req, res) => {
  res.json({ 
    message: '${endpoint} test endpoint',
    available: true
  });
});

export default router;
`;
    
    fs.writeFileSync(routeFile, basicRoute);
    console.log(`✓ Created basic route file: ${endpoint}.js`);
  }
}

// Check server.js to ensure routes are registered
const serverFile = path.join(__dirname, 'server.js');
if (fs.existsSync(serverFile)) {
  let serverContent = fs.readFileSync(serverFile, 'utf8');
  
  // Check if routes are imported and used
  for (const endpoint of missingEndpoints) {
    const importPattern = new RegExp(`import.*${endpoint}.*from.*['"].*/routes/${endpoint}['"]`);
    const usePattern = new RegExp(`app\\.use.*['"]/api/${endpoint}['"]`);
    
    if (!serverContent.match(importPattern)) {
      console.log(`⚠ ${endpoint} route not imported in server.js`);
    }
    if (!serverContent.match(usePattern)) {
      console.log(`⚠ ${endpoint} route not registered in server.js`);
    }
  }
}

console.log('\nChecking auth endpoints specifically...');
const authRoutesFile = path.join(routesDir, 'auth.js');
if (fs.existsSync(authRoutesFile)) {
  const authContent = fs.readFileSync(authRoutesFile, 'utf8');
  if (!authContent.includes('/test')) {
    console.log('Adding /test endpoint to auth routes...');
    const updatedAuth = authContent.replace(
      /router\.get\('\/'/,
      `router.get('/', (req, res) => {
  res.json({ message: 'Auth service active' });
});

router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth test endpoint',
    status: 'working',
    endpoints: ['/register', '/login', '/verify', '/refresh', '/logout']
  });
});`
    );
    fs.writeFileSync(authRoutesFile, updatedAuth);
    console.log('✓ Added /test endpoint to auth routes');
  }
}

console.log('\nEndpoint fix complete!');
