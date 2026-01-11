// middleware/auth.js - JWT Authentication
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const authenticateToken = (req, res, next) => {
  // Public endpoints that don't need auth
  const publicEndpoints = [
    '/health',
    '/api/sports-analytics/arbitrage',
    '/api/situational/spot-plays'
  ];
  
  if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    return next();
  }
  
  // For premium/secret endpoints
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication token required' 
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Rate limiting by user
export const userRateLimit = (req, res, next) => {
  const userId = req.user?.id || req.ip;
  // Implement Redis-based rate limiting
  next();
};
