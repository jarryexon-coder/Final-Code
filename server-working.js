// server-working.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import User from './models/user.js';

dotenv.config();

console.log('=== Starting Working Server ===');

const app = express();
app.use(cors());
app.use(express.json());

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Server is working', status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mongo: mongoose.connection.readyState === 1
  });
});

// Auth routes directly in server
app.post('/api/auth/register', async (req, res) => {
  console.log('📝 Register called');
  
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing fields'
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email exists'
      });
    }
    
    // Create and save user
    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      username: email.split('@')[0] + Date.now()
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid' });
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Connect and start
async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    
    app.listen(3002, () => {
      console.log('✅ Server running on http://localhost:3002');
      console.log('📝 Test: POST http://localhost:3002/api/auth/register');
    });
  } catch (error) {
    console.error('❌ MongoDB failed:', error.message);
    app.listen(3002, () => {
      console.log('✅ Server running (no MongoDB)');
    });
  }
}

start();
