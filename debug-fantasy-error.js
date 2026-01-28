import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    
    // Load fantasy routes with error handling
    try {
      const fantasyModule = await import('./routes/fantasyRoutes.js');
      const fantasyRouter = fantasyModule.default;
      
      // Add error logging middleware
      fantasyRouter.use((err, req, res, next) => {
        console.error('❌ Fantasy router error:', err.message);
        console.error(err.stack);
        res.status(500).json({
          success: false,
          error: 'Fantasy router error: ' + err.message
        });
      });
      
      // Mount with logging
      app.use('/api/fantasy', fantasyRouter);
      console.log('✅ Fantasy router mounted');
      
      // Test endpoint
      app.get('/test', (req, res) => res.json({ test: 'ok' }));
      
      const PORT = 3012;
      app.listen(PORT, () => {
        console.log(`\n✅ Server on port ${PORT}`);
        console.log('Test: http://localhost:3012/api/fantasy/players');
      });
      
    } catch (error) {
      console.log('❌ Error loading fantasy routes:', error.message);
      console.log(error.stack);
    }
  })
  .catch(err => {
    console.log('❌ MongoDB error:', err.message);
  });
