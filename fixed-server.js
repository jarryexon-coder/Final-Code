import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());

// Essential endpoints
app.get('/', (req, res) => {
  res.json({ message: 'Fixed Server Test' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// CRITICAL: Load routes BEFORE 404 handler
async function loadRoutes() {
  console.log('\n🔗 LOADING ROUTES...');
  
  const routes = [
    { path: '/api/auth', file: 'authRoutes.js', name: 'Auth' },
    { path: '/api/nba', file: 'nbaRoutes.js', name: 'NBA' }
  ];
  
  for (const route of routes) {
    try {
      console.log(`Loading ${route.name} from ${route.file}...`);
      const module = await import(`./routes/${route.file}`);
      
      if (module.default) {
        app.use(route.path, module.default);
        console.log(`✅ ${route.name} routes mounted at ${route.path}`);
      } else {
        console.log(`❌ ${route.name} has no default export`);
      }
    } catch (error) {
      console.log(`❌ Failed to load ${route.name}: ${error.message}`);
    }
  }
  
  console.log('✅ All routes loaded (if no errors above)');
}

// CRITICAL: 404 handler MUST BE LAST
app.use('*', (req, res) => {
  console.log(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server
async function start() {
  console.log('🚀 Starting fixed server...');
  
  // Load routes BEFORE starting server
  await loadRoutes();
  
  app.listen(PORT, () => {
    console.log(`\n🎉 Server running on http://localhost:${PORT}`);
    console.log('========================================');
    console.log('Test these endpoints:');
    console.log(`1. curl http://localhost:${PORT}/health`);
    console.log(`2. curl http://localhost:${PORT}/api/auth`);
    console.log(`3. curl http://localhost:${PORT}/api/auth/register`);
    console.log(`4. curl http://localhost:${PORT}/api/auth/health`);
    console.log('\nIf 2-4 fail, the router is not being mounted correctly.');
    console.log('========================================');
  });
}

start();
