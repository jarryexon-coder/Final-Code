import mongoose from 'mongoose';
import Player from './Player.js';
import Team from './Team.js';
import Stat from './Stat.js';
import Game from './Game.js';
import User from './User.js';
import Selection from './Selection.js';

// Connection to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export {
  connectDB,
  Player,
  Team,
  Stat,
  Game,
  User,
  Selection
};
