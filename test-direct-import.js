// Test importing route files directly
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testDirectImport() {
  console.log('🧪 Testing direct imports of route files\n');
  
  const files = [
    { name: 'fantasyRoutes.js', path: join(__dirname, 'routes', 'fantasyRoutes.js') },
    { name: 'picks.js', path: join(__dirname, 'routes', 'picks.js') },
    { name: 'news.js', path: join(__dirname, 'routes', 'news.js') }
  ];
  
  for (const file of files) {
    console.log(`📦 Testing ${file.name}:`);
    
    try {
      const module = await import(file.path);
      console.log(`  ✅ Import successful`);
      
      console.log(`  📋 Exports:`, Object.keys(module));
      
      if (module.default) {
        console.log(`  ✅ Has default export`);
        console.log(`  🔧 Type of default:`, typeof module.default);
        
        // Check if it's an Express router
        if (module.default.name === 'router' || 
            (typeof module.default === 'function' && module.default.stack)) {
          console.log(`  🎯 It's an Express router!`);
        }
      } else {
        console.log(`  ❌ No default export`);
      }
      
    } catch (error) {
      console.log(`  ❌ Import failed:`, error.message);
    }
    
    console.log('');
  }
}

testDirectImport();
