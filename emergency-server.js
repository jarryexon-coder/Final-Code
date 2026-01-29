// emergency-server.js
console.log('🚨 EMERGENCY SERVER - Minimal Debug Version');

// Force load environment FIRST
import { config } from 'dotenv';
config();

import express from 'express';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 3002;

// Only essential middleware
app.use(express.json());

// Single health endpoint
app.get('/health', (req, res) => {
  console.log('✅ Health check called');
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
      MONGODB_URI_EXISTS: !!process.env.MONGODB_URI
    }
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    test: 'OK',
    server: 'Emergency Debug Server' 
  });
});

async function startEmergencyServer() {
  console.log('🔍 Environment Status:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  
  try {
    // Connect to MongoDB only
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    
    // NO ROUTES LOADED - pure test server
    app.listen(PORT, () => {
      console.log(`🎉 Emergency server on port ${PORT}`);
      console.log('Test with:');
      console.log(`  curl https://pleasing-determination-production.up.railway.app/health`);
    });
    
  } catch (error) {
    console.error('❌ Emergency server failed:', error);
    process.exit(1);
  }
}

startEmergencyServer();
