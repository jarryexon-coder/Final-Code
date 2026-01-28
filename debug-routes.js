// debug-routes.js - Debug route loading issues
import { promises as fs } from 'fs';

async function debugRouteLoading() {
  console.log('🔍 Debugging Route Loading Issues\n');
  
  const routeFiles = [
    { name: 'fantasyRoutes.js', path: './routes/fantasyRoutes.js' },
    { name: 'picks.js', path: './routes/picks.js' },
    { name: 'news.js', path: './routes/news.js' }
  ];
  
  for (const route of routeFiles) {
    console.log(`\n📁 Checking ${route.name}:`);
    
    try {
      // Check if file exists
      await fs.access(route.path);
      console.log(`✅ File exists`);
      
      // Read first few lines to check export
      const content = await fs.readFile(route.path, 'utf8');
      const lines = content.split('\n').slice(0, 10).join('\n');
      
      console.log(`📄 First 10 lines:`);
      console.log(lines);
      
      // Check for export
      if (content.includes('export default') || content.includes('module.exports')) {
        console.log(`✅ Has export statement`);
      } else {
        console.log(`❌ No export found`);
      }
      
    } catch (error) {
      console.log(`❌ File error: ${error.message}`);
    }
  }
  
  console.log('\n========================================');
  console.log('Possible fixes:');
  console.log('1. Check that route files have "export default router"');
  console.log('2. Make sure the path in server.js matches the file name');
  console.log('3. The route might be loaded but with different base path');
  console.log('========================================');
}

debugRouteLoading().catch(console.error);
