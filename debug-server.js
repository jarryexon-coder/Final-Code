// debug-server.js
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

console.log('🔧 Starting Debug Server...\n');

// Simple User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  role: { type: String, default: 'user' }
}, { timestamps: true });

// Simple pre-save
userSchema.pre('save', function(next) {
  if (this.isModified('password')) {
    const salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
  }
  if (this.name && !this.firstName) {
    const parts = this.name.split(' ');
    this.firstName = parts[0] || 'User';
    this.lastName = parts.slice(1).join(' ') || 'User';
  }
  next();
});

const User = mongoose.model('User', userSchema);

// Debug registration endpoint
app.post('/debug/register', async (req, res) => {
  try {
    console.log('📝 Registration request:', req.body);
    
    const { email, password, name } = req.body;
    
    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    
    // Create user
    const user = new User({
      email,
      password,
      name,
      firstName: name.split(' ')[0] || 'User',
      lastName: name.split(' ').slice(1).join(' ') || 'User'
    });
    
    console.log('👤 User object before save:', {
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName
    });
    
    await user.save();
    
    console.log('✅ User saved:', user._id);
    
    // Generate simple token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      'debug-secret',
      { expiresIn: '1h' }
    );
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      token
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ error: 'Validation failed', details: errors });
    } else if (error.code === 11000) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Connect and start
async function startDebugServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('✅ Connected to MongoDB');
    
    app.listen(3003, () => {
      console.log('✅ Debug server running on http://localhost:3003');
      console.log('\n📋 Test with:');
      console.log('curl -X POST http://localhost:3003/debug/register \\');
      console.log('  -H "Content-Type: application/json" \\');
      console.log('  -d \'{"email":"test@debug.com","password":"test123","name":"Debug User"}\'');
    });
  } catch (error) {
    console.error('❌ Failed to start:', error.message);
  }
}

startDebugServer();
