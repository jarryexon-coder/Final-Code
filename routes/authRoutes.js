// routes/authRoutes.js - UPDATED WITH HEALTH ENDPOINT
import express from 'express';
const router = express.Router();

console.log('✅ Auth Routes loaded');

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NBA Fantasy AI Auth API',
    version: '1.0.0',
    endpoints: [
      { method: 'GET', path: '/api/auth/register', description: 'Get registration info' },
      { method: 'POST', path: '/api/auth/register', description: 'Register new user' },
      { method: 'GET', path: '/api/auth/login', description: 'Get login info' },
      { method: 'POST', path: '/api/auth/login', description: 'User login' },
      { method: 'GET', path: '/api/auth/health', description: 'Auth service health' },
      { method: 'GET', path: '/api/auth/profile', description: 'Get user profile (protected)' }
    ],
    timestamp: new Date().toISOString()
  });
});

// Health endpoint (YOUR FRONTEND IS CALLING THIS)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is healthy',
    service: 'Authentication Service',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: [
      'GET /api/auth',
      'GET /api/auth/register',
      'POST /api/auth/register',
      'GET /api/auth/login',
      'POST /api/auth/login',
      'GET /api/auth/profile',
      'GET /api/auth/health'
    ]
  });
});

// ====================
// REGISTRATION ENDPOINTS
// ====================
router.get('/register', (req, res) => {
  res.json({
    success: true,
    message: 'User registration endpoint',
    method: 'POST',
    required_fields: ['email', 'password', 'name'],
    example_request: {
      email: 'user@example.com',
      password: 'Password123!',
      name: 'John Doe'
    },
    example_response: {
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: 'user_123',
          email: 'user@example.com',
          name: 'John Doe',
          createdAt: '2024-01-29T14:00:00.000Z'
        },
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIs...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIs...'
        }
      }
    }
  });
});

router.post('/register', async (req, res) => {
  try {
    console.log('📝 POST /api/auth/register called with:', req.body);
    
    const { email, password, name } = req.body;
    
    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password, name'
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }
    
    // Mock successful registration
    const mockUserId = 'user_' + Date.now();
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: mockUserId,
          email: email,
          name: name,
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        tokens: {
          accessToken: 'mock_access_token_' + mockUserId,
          refreshToken: 'mock_refresh_token_' + mockUserId,
          expiresIn: 3600
        }
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// ====================
// LOGIN ENDPOINTS
// ====================
router.get('/login', (req, res) => {
  res.json({
    success: true,
    message: 'User login endpoint',
    method: 'POST',
    required_fields: ['email', 'password'],
    example_request: {
      email: 'user@example.com',
      password: 'Password123!'
    }
  });
});

router.post('/login', async (req, res) => {
  try {
    console.log('🔑 POST /api/auth/login called with:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing email or password'
      });
    }
    
    // Mock authentication
    if (email === 'test@test.com' && password === 'Test123!') {
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 'user_123456',
            email: email,
            name: 'Test User',
            role: 'user',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email
          },
          tokens: {
            accessToken: 'mock_login_token_' + Date.now(),
            refreshToken: 'mock_refresh_token_' + Date.now(),
            expiresIn: 3600
          }
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// ====================
// USER PROFILE
// ====================
router.get('/profile', (req, res) => {
  // Mock authenticated user (in real app, verify JWT)
  const mockUser = {
    id: 'user_123456',
    email: 'user@example.com',
    name: 'John Doe',
    role: 'user',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    createdAt: '2024-01-01T00:00:00.000Z',
    stats: {
      predictions: 42,
      accuracy: 0.78,
      fantasyTeams: 3
    }
  };
  
  res.json({
    success: true,
    message: 'User profile retrieved',
    data: {
      user: mockUser
    }
  });
});

// ====================
// HEALTH CHECK
// ====================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is healthy',
    service: 'Authentication Service',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: [
      'GET /api/auth',
      'GET /api/auth/register',
      'POST /api/auth/register',
      'GET /api/auth/login',
      'POST /api/auth/login',
      'GET /api/auth/profile',
      'GET /api/auth/health'
    ]
  });
});

// ====================
// LOGOUT (MOCK)
// ====================
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ====================
// TOKEN REFRESH (MOCK)
// ====================
router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token required'
    });
  }
  
  res.json({
    success: true,
    message: 'Token refreshed',
    data: {
      accessToken: 'new_access_token_' + Date.now(),
      refreshToken: 'new_refresh_token_' + Date.now(),
      expiresIn: 3600
    }
  });
});

export default router;
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth', timestamp: new Date().toISOString() });
});
