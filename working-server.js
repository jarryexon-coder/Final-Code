// working-server.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

console.log('=== Starting Server ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MongoDB URI present:', !!process.env.MONGODB_URI);

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running',
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
    mongoState: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3002;

// Improved MongoDB connection with better error handling
async function connectToMongoDB() {
  try {
    console.log('Attempting MongoDB connection...');
    
    // Remove any problematic options for newer mongoose versions
    await mongoose.connect(process.env.MONGODB_URI, {
      // No need for useNewUrlParser or useUnifiedTopology in mongoose 6+
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log(`📁 Database: ${mongoose.connection.name}`);
    console.log(`🏠 Host: ${mongoose.connection.host}`);
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Try alternative connection method if SRV fails
    if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED')) {
      console.log('🔄 Trying alternative connection method...');
      
      // Try with direct connection string
      const directUri = process.env.MONGODB_URI.replace('mongodb+srv://', 'mongodb://');
      console.log('Using direct connection:', directUri.substring(0, 50) + '...');
      
      try {
        await mongoose.connect(directUri, {
          serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ Connected via direct method!');
        return true;
      } catch (directError) {
        console.error('❌ Direct connection also failed:', directError.message);
      }
    }
    
    return false;
  }
}

// Start server
async function startServer() {
  const mongoConnected = await connectToMongoDB();
  
  if (!mongoConnected) {
    console.log('⚠️ Starting server without MongoDB connection...');
  }
  
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🎯 MongoDB: ${mongoConnected ? 'Connected' : 'Not connected'}`);
  });
}

// Handle errors
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

startServer().catch(console.error);
