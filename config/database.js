// config/database.js - Enhanced version
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nba-app';

// Connection options
const connectionOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  w: 'majority'
};

// Connection state
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRIES = 3;

// Connect to MongoDB
export const connectDB = async () => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return mongoose.connection;
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, connectionOptions);
    
    isConnected = true;
    connectionAttempts = 0;
    
    console.log('✅ MongoDB connected successfully');
    
    // Set up event listeners
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected');
      isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error.message);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      isConnected = true;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

    return mongoose.connection;
  } catch (error) {
    connectionAttempts++;
    console.error(`❌ MongoDB connection failed (attempt ${connectionAttempts}):`, error.message);
    
    if (connectionAttempts < MAX_RETRIES) {
      console.log(`🔄 Retrying connection in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB();
    } else {
      throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
    }
  }
};

// Check connection status
export const checkConnection = async () => {
  try {
    const state = mongoose.connection.readyState;
    
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      connected: state === 1,
      state: states[state] || 'unknown',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      models: Object.keys(mongoose.connection.models),
      readyState: state
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      state: 'error'
    };
  }
};

// Disconnect from MongoDB
export const disconnectDB = async () => {
  try {
    if (isConnected) {
      await mongoose.connection.close();
      isConnected = false;
      console.log('🔌 MongoDB disconnected');
    }
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error.message);
  }
};

// Get Mongoose instance
export const getMongoose = () => mongoose;

// Health check
export const healthCheck = async () => {
  const connectionStatus = await checkConnection();
  
  return {
    service: 'mongodb',
    status: connectionStatus.connected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    details: connectionStatus,
    dependencies: {
      mongodb: connectionStatus.connected ? 'connected' : 'disconnected'
    }
  };
};

export default {
  connectDB,
  disconnectDB,
  checkConnection,
  getMongoose,
  healthCheck,
  isConnected: () => isConnected,
  connection: mongoose.connection
};
