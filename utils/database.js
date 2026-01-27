import mongoose from 'mongoose';

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    // Check if already connected via the main server connection
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Database service: Using existing MongoDB connection');
      this.isConnected = true;
      return mongoose.connection;
    }

    // If not connected, this is a fallback (shouldn't normally happen)
    try {
      console.log('⚠️ Database service: No active connection, attempting fallback...');
      
      const MONGODB_URI = process.env.MONGODB_URI;
      if (!MONGODB_URI) {
        throw new Error('MONGODB_URI not configured');
      }
      
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10
      });

      this.isConnected = true;
      console.log('✅ Database service: MongoDB connected via fallback');
      
      return mongoose.connection;
      
    } catch (error) {
      console.error('❌ Database service fallback failed:', error.message);
      throw new Error('Database connection not available. Ensure connectDB() is called in server.js first');
    }
  }

  async disconnect() {
    // Don't actually disconnect here since main server manages the connection
    if (this.isConnected) {
      this.isConnected = false;
      console.log('ℹ️ Database service: Connection reference released (actual connection managed by server)');
    }
  }

  getStatus() {
    return {
      serviceConnected: this.isConnected,
      mongooseReadyState: mongoose.connection?.readyState || 0,
      mongooseConnected: mongoose.connection?.readyState === 1,
      host: mongoose.connection?.host || 'Not connected',
      name: mongoose.connection?.name || 'Not connected'
    };
  }

  // Utility methods for database operations
  async query(collection, query = {}, options = {}) {
    if (!this.isConnected) {
      await this.connect();
    }
    return await mongoose.connection.collection(collection).find(query, options).toArray();
  }

  async findOne(collection, query = {}, options = {}) {
    if (!this.isConnected) {
      await this.connect();
    }
    return await mongoose.connection.collection(collection).findOne(query, options);
  }

  async insert(collection, document) {
    if (!this.isConnected) {
      await this.connect();
    }
    return await mongoose.connection.collection(collection).insertOne(document);
  }

  async update(collection, filter, update, options = {}) {
    if (!this.isConnected) {
      await this.connect();
    }
    return await mongoose.connection.collection(collection).updateOne(filter, update, options);
  }

  async delete(collection, filter, options = {}) {
    if (!this.isConnected) {
      await this.connect();
    }
    return await mongoose.connection.collection(collection).deleteOne(filter, options);
  }

  async aggregate(collection, pipeline = []) {
    if (!this.isConnected) {
      await this.connect();
    }
    return await mongoose.connection.collection(collection).aggregate(pipeline).toArray();
  }

  getCollection(collectionName) {
    if (!this.isConnected && mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }
    return mongoose.connection.collection(collectionName);
  }
}

export default new Database();
