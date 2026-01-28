import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Connect to MongoDB first
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    
    // Try to load fantasy routes
    try {
      const fantasyModule = await import('./routes/fantasyRoutes.js');
      app.use('/api/fantasy', fantasyModule.default);
      console.log('✅ fantasyRoutes mounted');
      
      // Add health endpoint
      app.get('/api/fantasy', (req, res) => {
        res.json({
          success: true,
          message: 'Fantasy API Health Check',
          timestamp: new Date().toISOString()
        });
      });
      
      app.get('/api/fantasy/', (req, res) => {
        res.json({
          success: true,
          message: 'Fantasy API Health Check (with slash)',
          timestamp: new Date().toISOString()
        });
      });
      
      // Test route
      app.get('/test', (req, res) => res.json({ test: 'ok' }));
      
      // Start server
      const PORT = 3008;
      app.listen(PORT, () => {
        console.log(`\n✅ Server on port ${PORT}`);
        console.log('Test endpoints:');
        console.log(`  http://localhost:${PORT}/api/fantasy`);
        console.log(`  http://localhost:${PORT}/api/fantasy/players`);
        console.log(`  http://localhost:${PORT}/test`);
      });
      
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  })
  .catch(err => {
    console.log('❌ MongoDB connection failed:', err.message);
  });
