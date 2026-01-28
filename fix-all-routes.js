import { readFileSync, writeFileSync } from 'fs';

function addRootRoute(filePath, routeName) {
  console.log(`\n📝 Checking ${filePath}...`);
  
  try {
    let content = readFileSync(filePath, 'utf8');
    
    // Skip if already has root route
    if (content.includes("router.get('/',") || content.includes('router.get("/",')) {
      console.log(`  ✅ Already has root route`);
      return true;
    }
    
    // Find router declaration
    const lines = content.split('\n');
    let insertIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('const router = express.Router();') || 
          lines[i].includes('const router = Router();')) {
        insertIndex = i + 1;
        break;
      }
    }
    
    if (insertIndex > 0) {
      // Add root route
      const rootRoute = [
        '',
        `// Root ${routeName} route`,
        `router.get('/', (req, res) => {`,
        `  res.json({`,
        `    success: true,`,
        `    message: '${routeName} API is working',`,
        `    timestamp: new Date().toISOString(),`,
        `    version: '1.0.0'`,
        `  });`,
        `});`,
        ''
      ];
      
      lines.splice(insertIndex, 0, ...rootRoute);
      writeFileSync(filePath, lines.join('\n'));
      console.log(`  ✅ Added root route to ${routeName}`);
      return true;
    } else {
      console.log(`  ❌ Could not find router declaration in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

// Fix the problematic routes
console.log('🔧 Adding missing root routes...');

const routesToFix = [
  { path: './routes/fantasyRoutes.js', name: 'Fantasy' },
  { path: './routes/picks.js', name: 'Picks' },
  { path: './routes/news.js', name: 'News' },
];

let fixed = 0;
for (const route of routesToFix) {
  if (addRootRoute(route.path, route.name)) {
    fixed++;
  }
}

console.log(`\n✅ Fixed ${fixed}/${routesToFix.length} route files`);
console.log('\nRestart your server and test:');
console.log('  curl http://localhost:3002/api/fantasy');
console.log('  curl http://localhost:3002/api/picks');
console.log('  curl http://localhost:3002/api/news');
