// test-routes-directly.js
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Test basic route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route works' });
});

// Test the new auth routes
import authRoutes from './routes/authRoutes-new.js';
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

app.listen(3006, () => {
  console.log('✅ Test server running on http://localhost:3006');
  console.log('📝 Test routes:');
  console.log('   GET  http://localhost:3006/test');
  console.log('   GET  http://localhost:3006/api/auth/health');
  console.log('   POST http://localhost:3006/api/auth/register');
});
