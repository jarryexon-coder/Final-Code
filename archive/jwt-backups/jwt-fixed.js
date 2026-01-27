import jwt from 'jsonwebtoken';

console.log('=== LOADING FIXED JWT SERVICE ===');

const JWTService = {
  secret: 'test-secret-key-for-now',
  
  generateAccessToken(user) {
    console.log('Generating access token at:', new Date().toISOString());
    const payload = {
      userId: user.userId || user._id,
      email: user.email,
      role: user.role || 'user'
    };
    return jwt.sign(payload, this.secret, { expiresIn: '15m' });
  },
  
  generateRefreshToken(user) {
    console.log('Generating refresh token at:', new Date().toISOString());
    return jwt.sign({
      userId: user.userId || user._id
    }, this.secret + '-refresh', { expiresIn: '7d' });
  },
  
  // ADD THESE MISSING METHODS
  generateResetToken(email) {
    console.log('Generating reset token for:', email, 'at:', new Date().toISOString());
    return jwt.sign(
      { email, purpose: 'password_reset' },
      this.secret + '-reset',
      { expiresIn: '1h' }
    );
  },
  
  verifyResetToken(token) {
    console.log('Verifying reset token at:', new Date().toISOString());
    return jwt.verify(token, this.secret + '-reset');
  },
  
  verifyAccessToken(token) {
    return jwt.verify(token, this.secret);
  },
  
  verifyRefreshToken(token) {
    return jwt.verify(token, this.secret + '-refresh');
  }
};

export default JWTService;
