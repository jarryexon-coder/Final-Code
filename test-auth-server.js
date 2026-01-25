// test-auth-server.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutesFixed from './routes/authRoutes-fixed.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Auth test server', status: 'running' });
});

// Use fixed auth routes
app.use('/api/auth', authRoutesFixed);

const PORT = 3004;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    
    app.listen(PORT, () => {
      console.log(`✅ Auth test server running on http://localhost:${PORT}`);
      console.log(`📝 Test: POST http://localhost:${PORT}/api/auth/register-simple`);
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Start without MongoDB
    app.listen(PORT, () => {
      console.log(`⚠️ Server running without MongoDB on http://localhost:${PORT}`);
    });
  }
}

startServer();
