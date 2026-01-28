// Simple test to see what's happening
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    
    // Load fantasy routes
    const fantasyModule = await import('./routes/fantasyRoutes.js');
    const fantasyRouter = fantasyModule.default;
    
    // Mount the router
    app.use('/api/fantasy', fantasyRouter);
    console.log('✅ Fantasy router mounted');
    
    // Test what happens with different URLs
    app.get('/test1', (req, res) => res.json({ test: '1' }));
    app.get('/test2', (req, res) => res.json({ test: '2' }));
    
    // Debug middleware
    app.use((req, res, next) => {
      console.log(`📝 ${req.method} ${req.url}`);
      next();
    });
    
    const PORT = 3010;
    app.listen(PORT, () => {
      console.log(`\n✅ Test server on port ${PORT}`);
      console.log('Test endpoints:');
      console.log(`  http://localhost:${PORT}/api/fantasy`);
      console.log(`  http://localhost:${PORT}/api/fantasy/`);
      console.log(`  http://localhost:${PORT}/api/fantasy/players`);
      console.log(`  http://localhost:${PORT}/test1`);
    });
  })
  .catch(err => {
    console.log('❌ MongoDB error:', err.message);
  });
