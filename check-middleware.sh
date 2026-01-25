#!/bin/bash
# check-middleware.sh

echo "🔍 Checking middleware..."
echo "=============================================================="

# Check if adminAuth middleware exists
if [ -f "middleware/adminAuth.js" ]; then
    echo "✅ adminAuth.js exists"
    echo "Content preview:"
    head -20 middleware/adminAuth.js
else
    echo "❌ adminAuth.js NOT FOUND!"
    echo "Creating adminAuth middleware..."
    
    mkdir -p middleware
    cat > middleware/adminAuth.js << 'ADMIN_AUTH'
// middleware/adminAuth.js
// Simple admin authentication middleware

export const adminAuth = (req, res, next) => {
  try {
    // Check if user is authenticated (simplified)
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }
    
    // In a real app, you would verify the token and check admin role
    // For now, we'll just mock it
    req.user = {
      id: 'admin_user',
      role: 'admin',
      permissions: ['read', 'write', 'delete']
    };
    
    console.log('Admin auth: User authenticated as admin');
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};
ADMIN_AUTH
    
    echo "✅ Created adminAuth.js middleware"
fi

echo ""
echo "🔍 Checking all middleware files..."
ls -la middleware/
