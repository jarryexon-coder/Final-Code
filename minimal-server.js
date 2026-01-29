import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

console.log('🚀 Starting MINIMAL NBA Fantasy Backend');

const app = express();
const PORT = 3005;

// Minimal middleware
app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: 'minimal' });
});

// Load and mount auth routes DIRECTLY
async function setupAuthRoutes() {
  try {
    console.log('📁 Loading auth routes...');
    const authModule = await import('./routes/authRoutes.js');
    
    if (authModule.default) {
      app.use('/api/auth', authModule.default);
      console.log('✅ Auth routes mounted at /api/auth');
      
      // Debug: List routes
      console.log('🔍 Routes in auth router:');
      authModule.default.stack.forEach((layer, i) => {
        if (layer.route) {
          console.log(`  ${i}. ${Object.keys(layer.route.methods)} ${layer.route.path}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Failed to load auth routes:', error.message);
  }
}

// Direct test routes (will definitely work)
app.get('/api/direct-test', (req, res) => {
  res.json({ message: 'Direct route works!' });
});

app.get('/api/direct-auth/register', (req, res) => {
  res.json({ message: 'Direct auth register works!' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🎉 Server running on http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/direct-test`);
  console.log(`🔐 Auth test: http://localhost:${PORT}/api/direct-auth/register`);
  
  // Setup auth routes after server starts
  await setupAuthRoutes();
  
  console.log('\n✅ Ready for testing!');
  console.log('Test router routes:');
  console.log(`  curl http://localhost:${PORT}/api/auth/register`);
  console.log(`  curl http://localhost:${PORT}/api/auth/health`);
});
