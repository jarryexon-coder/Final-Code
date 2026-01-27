import jwt from 'jsonwebtoken';

// CONSISTENT SECRET - SAME EVERYWHERE
const JWTService = {
  secret: 'test-secret-key-for-now',
  
  generateAccessToken(user) {
    console.log('JWT: Generating access token');
    return jwt.sign({
      userId: user.userId || user._id,
      email: user.email,
      role: user.role || 'user'
    }, this.secret, { expiresIn: '15m' });
  },
  
  generateRefreshToken(user) {
    console.log('JWT: Generating refresh token');
    return jwt.sign({
      userId: user.userId || user._id
    }, this.secret + '-refresh', { expiresIn: '7d' });
  },
  
  verifyAccessToken(token) {
    console.log('JWT: Verifying access token');
    return jwt.verify(token, this.secret);
  },
  
  verifyRefreshToken(token) {
    return jwt.verify(token, this.secret + '-refresh');
  },
  
  generateResetToken(email) {
    return jwt.sign(
      { email, purpose: 'password_reset' },
      this.secret + '-reset',
      { expiresIn: '1h' }
    );
  },
  
  verifyResetToken(token) {
    return jwt.verify(token, this.secret + '-reset');
  }
};

export default JWTService;
