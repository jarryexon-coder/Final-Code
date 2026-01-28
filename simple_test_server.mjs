// Simple test server to verify basic functionality
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/test-health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Test server is running',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  });
});

// Database test endpoint
app.get('/test-db', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      status: 'connected',
      database: mongoose.connection.db.databaseName,
      collections: collections.map(c => c.name),
      count: collections.length
    });
    
    await mongoose.disconnect();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Test endpoints:`);
  console.log(`  http://localhost:${PORT}/test-health`);
  console.log(`  http://localhost:${PORT}/test-db`);
});
