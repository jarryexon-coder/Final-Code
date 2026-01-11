import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  constructor() {
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async connect() {
    try {
      if (this.isConnected) {
        console.log('✅ Using existing database connection');
        return mongoose.connection;
      }

      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nba_fantasy_ai';
      
      console.log('🔗 Connecting to MongoDB...');
      
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10
      });

      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
      
      // Connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        this.isConnected = true;
      });

      return mongoose.connection;
      
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      this.retryCount++;
      
      if (this.retryCount < this.maxRetries) {
        console.log(`🔄 Retrying connection (${this.retryCount}/${this.maxRetries})...`);
        setTimeout(() => this.connect(), 2000);
      } else {
        throw new Error('Max connection retries exceeded');
      }
    }
  }

  async disconnect() {
    try {
      if (this.isConnected) {
        await mongoose.disconnect();
        this.isConnected = false;
        console.log('✅ MongoDB disconnected');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      readyState: mongoose.connection?.readyState,
      host: mongoose.connection?.host,
      name: mongoose.connection?.name
    };
  }
}

export default new Database();
