import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app) {
  const routesDir = __dirname;
  
  // Read all route files
  const files = fs.readdirSync(routesDir);
  const routeFiles = files.filter(file => file.endsWith('.routes.js'));
  
  for (const file of routeFiles) {
    try {
      const routePath = path.join(routesDir, file);
      const routeModule = await import(`./${file}`);
      const router = router || routeModule;
      
      // Extract base path from filename
      const basePath = file.replace('.routes.js', '');
      
      // Register route with appropriate base path
      switch (basePath) {
        case 'auth':
          app.use('/api/auth', router);
          break;
        case 'dailyLimits':
        case 'prizepicks':
        case 'selections':
        case 'analytics':
        case 'lines':
        case 'bumpRisk':
          app.use('/api/prizepicks', router);
          break;
        case 'sportsbooks':
          app.use('/api/sportsbooks', router);
          break;
        case 'combinations':
          app.use('/api/combinations', router);
          break;
        case 'notifications':
          app.use('/api/notifications', router);
          break;
        case 'simulations':
          app.use('/api/simulate', router);
          break;
        case 'userPreferences':
          app.use('/api/user', router);
          break;
        case 'admin':
          app.use('/api/admin', router);
          break;
        case 'sportsData':
          app.use('/api/sports', router);
          break;
        case 'history':
          app.use('/api/history', router);
          break;
        case 'search':
          app.use('/api/search', router);
          break;
        case 'social':
          app.use('/api/social', router);
          break;
        default:
          console.warn(`Unknown route file: ${file}`);
      }
      
      console.log(`Registered routes from: ${file}`);
    } catch (error) {
      console.error(`Error loading route file ${file}:`, error);
    }
  }
}

// Default export for compatibility
export default { registerRoutes };