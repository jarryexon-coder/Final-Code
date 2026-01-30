// CLEAN SERVER - NO SCHEDULER
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 3002;

// Health endpoints (IMMEDIATE)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/railway-health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// CORS
app.use(cors({
  origin: ['https://februaryfantasy-production.up.railway.app'],
  credentials: true
}));

app.use(express.json());

// Simple routes
app.get('/', (req, res) => {
  res.json({ message: 'NBA Fantasy', status: 'OK' });
});

app.get('/api/nba', (req, res) => {
  res.json({ message: 'NBA API', status: 'safe' });
});

// Start server
async function startServer() {
  console.log('Starting server...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
}

startServer();
