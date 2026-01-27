// routes/authRoutes.js - COMPLETE AUTHENTICATION API WITH VALIDATION
import express from 'express';
import Joi from 'joi';
import jwtService from '../utils/jwt.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

console.log('🔄 Loading authRoutes.js');
console.log('User model loaded:', !!User);

const router = express.Router();

// Validation schemas
const validationSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string()
      .min(6)
      .max(30)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.max': 'Password cannot exceed 30 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    name: Joi.string()
      .min(2)
      .max(100)
      .pattern(/^[a-zA-Z\s-']+$/)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 100 characters',
        'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes',
        'any.required': 'Name is required'
      })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    })
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required'
    }),
    password: Joi.string()
      .min(6)
      .max(30)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.max': 'Password cannot exceed 30 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string()
      .min(6)
      .max(30)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'New password must be at least 6 characters',
        'string.max': 'New password cannot exceed 30 characters',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
      })
  }),

  updateProfile: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .pattern(/^[a-zA-Z\s-']+$/)
      .optional()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 100 characters',
        'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes'
      }),
    firstName: Joi.string()
      .min(1)
      .max(50)
      .pattern(/^[a-zA-Z\s-']+$/)
      .optional()
      .messages({
        'string.min': 'First name must be at least 1 character',
        'string.max': 'First name cannot exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes'
      }),
    lastName: Joi.string()
      .min(1)
      .max(50)
      .pattern(/^[a-zA-Z\s-']+$/)
      .optional()
      .messages({
        'string.min': 'Last name must be at least 1 character',
        'string.max': 'Last name cannot exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes'
      }),
    preferences: Joi.object({
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional(),
        frequency: Joi.string().valid('instant', 'daily', 'weekly').optional()
      }).optional(),
      theme: Joi.string().valid('light', 'dark', 'system', 'auto').optional(),
      language: Joi.string().valid('en', 'es', 'fr', 'de', 'pt', 'zh').optional()
    }).optional()
  })
};

// Validation middleware
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { 
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    // If validation passed, replace the validated data
    req[property] = value;
    next();
  };
};

// Register new user - USING STATIC METHOD
router.post('/register', validate(validationSchemas.register), async (req, res) => {
  try {
    const { email, password, name } = req.body;

    console.log('📝 Registration attempt for:', email);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Use static method to create user
    const user = await User.createUser({
      email,
      password,
      name,
      role: 'user',
      status: 'active',
      stats: {
        loginCount: 0,
        lastLogin: null
      },
      subscription: {
        status: 'inactive',
        plan: 'free'
      }
    });

    console.log('✅ User created:', user._id);

    // Generate tokens
    const userDataForTokens = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    };

    const accessToken = jwtService.generateAccessToken(userDataForTokens);
    const refreshToken = jwtService.generateRefreshToken(userDataForTokens);

    // Store refresh token in user
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({
      token: refreshToken,
      device: req.headers['user-agent'] || 'unknown',
      ip: req.ip || 'unknown',
      createdAt: new Date()
    });

    await user.save();
    console.log('✅ Tokens generated');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt
        },
        tokens: {
          accessToken,
          refreshToken,
          accessTokenExpiry: '15 minutes',
          refreshTokenExpiry: '7 days'
        }
      }
    });
    
    console.log('🎉 Registration completed successfully');

  } catch (error) {
    console.error('❌ REGISTRATION ERROR:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.values(error.errors).forEach(err => {
        console.error(`  - ${err.path}: ${err.message} (value: "${err.value}")`);
      });
      
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }
    
    // Handle duplicate email
    if (error.code === 11000) {
      console.error('Duplicate email error');
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    console.error('Unexpected error type:', error.constructor.name);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login user - UPDATED
router.post('/login', validate(validationSchemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔑 Login attempt for:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password using instance method (assuming it's async)
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update login stats
    user.stats.loginCount += 1;
    user.stats.lastLogin = new Date();

    // Generate tokens
    const userDataForTokens = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    };

    const accessToken = jwtService.generateAccessToken(userDataForTokens);
    const refreshToken = jwtService.generateRefreshToken(userDataForTokens);

    // Store refresh token
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({
      token: refreshToken,
      device: req.headers['user-agent'] || 'unknown',
      ip: req.ip || 'unknown',
      createdAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        tokens: {
          accessToken,
          refreshToken,
          accessTokenExpiry: '15 minutes',
          refreshTokenExpiry: '7 days'
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwtService.verifyRefreshToken(refreshToken);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found'
      });
    }

    // Generate new access token
    const userData = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    };
    
    const accessToken = jwtService.generateAccessToken(userData);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: {
        accessToken,
        accessTokenExpiry: '15 minutes'
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      error: error.message
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findById(req.user.userId);

    if (user && refreshToken) {
      // Filter out the refresh token
      user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -refreshTokens -resetToken -resetTokenExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, validate(validationSchemas.updateProfile), async (req, res) => {
  try {
    const { name, firstName, lastName, preferences } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update name fields
    if (name) {
      const nameParts = name.trim().split(/\s+/);
      user.name = name;
      user.firstName = nameParts[0] || user.firstName;
      user.lastName = nameParts.slice(1).join(' ') || user.lastName;
    }
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    
    // Update full name if firstName or lastName changed
    if ((firstName || lastName) && !name) {
      user.name = `${user.firstName} ${user.lastName}`.trim();
    }
    
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          preferences: user.preferences
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Request password reset
router.post('/forgot-password', validate(validationSchemas.forgotPassword), async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal that user doesn't exist (security best practice)
      return res.json({
        success: true,
        message: 'If an account exists, a reset email has been sent'
      });
    }

    // Generate reset token
    const resetToken = jwtService.generateResetToken(email);
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour

    await user.save();

    // In production, send email here
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: 'Password reset email sent',
      data: {
        resetToken, // In production, don't send token in response
        expiresIn: '1 hour'
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process reset request',
      error: error.message
    });
  }
});

// Reset password
router.post('/reset-password', validate(validationSchemas.resetPassword), async (req, res) => {
  try {
    const { token, password } = req.body;

    // Verify token
    const decoded = jwtService.verifyResetToken(token);
    const user = await User.findOne({ 
      email: decoded.email,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});

// Verify email (simplified version)
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // In production, verify email token properly
    const user = await User.findOne({ verificationToken: token });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message
    });
  }
});

// Change password (authenticated)
router.post('/change-password', authenticateToken, validate(validationSchemas.changePassword), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/refresh',
      'POST /api/auth/logout',
      'GET /api/auth/profile',
      'PUT /api/auth/profile',
      'POST /api/auth/forgot-password',
      'POST /api/auth/reset-password',
      'POST /api/auth/change-password'
    ]
  });
});

export default router;
