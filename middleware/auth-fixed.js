// middleware/auth.js - FIXED VERSION
import jwtService from '../utils/jwt.js';

export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    const decoded = jwtService.verifyAccessToken(token);
    
    // Attach user to request
    req.user = decoded;
    
    // REMOVED: Check if token is about to expire
    // if (jwtService.isTokenExpiringSoon(token)) {
    //   res.setHeader('X-Token-Needs-Refresh', 'true');
    // }

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.message === 'Access token expired') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Invalid or malformed token',
      code: 'INVALID_TOKEN'
    });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

export const requirePremium = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const isPremium = req.user.role === 'premium' || 
                     req.user.role === 'admin' || 
                     (req.user.subscription && 
                      req.user.subscription.tier !== 'free' && 
                      req.user.subscription.status === 'active');
    
    if (!isPremium) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required',
        code: 'PREMIUM_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Premium check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify subscription'
    });
  }
};
