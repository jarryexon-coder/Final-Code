// middleware/auth.js
const jwt = require('jsonwebtoken');

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // For development/testing, allow bypass
  if (process.env.NODE_ENV === 'development' && req.headers['x-bypass-auth'] === 'true') {
    req.user = { id: 'dev_user', email: 'dev@example.com', role: 'admin' };
    return next();
  }
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
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

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };
