// routes/authRoutes-fixed.js
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const router = express.Router();

// Simple registration without complex checks
router.post('/register-simple', async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password, firstName, lastName'
      });
    }
    
    // Create user
    const user = new User({
      email: email.toLowerCase().trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      username: email.split('@')[0] + Date.now() // Make username unique
    });
    
    console.log('User to save:', {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username
    });
    
    // Save user
    await user.save();
    console.log('User saved successfully:', user._id);
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Registration error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      keyValue: error.keyValue
    });
    
    // Handle specific errors
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email or username already exists',
        field: Object.keys(error.keyValue)[0]
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
