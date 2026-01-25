// minimal-test-server.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'Minimal server is running', time: new Date().toISOString() });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Test auth endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Register called with:', req.body);
  res.json({ 
    success: true, 
    message: 'Registration would happen here',
    test: true 
  });
});

const PORT = process.env.PORT || 3002;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`✅ Minimal server running on http://localhost:${PORT}`);
      console.log(`📊 Test registration: POST http://localhost:${PORT}/api/auth/register`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    // Start server anyway for testing
    app.listen(PORT, () => {
      console.log(`✅ Server running (without MongoDB) on http://localhost:${PORT}`);
    });
  });
