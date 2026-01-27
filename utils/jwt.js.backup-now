import jwt from 'jsonwebtoken';

console.log('=== LOADING VERIFIED CORRECT JWT SERVICE ===');

const JWTService = {
  secret: 'test-secret-key-for-now',
  
  generateAccessToken(user) {
    const payload = {
      userId: user.userId || user._id,
      email: user.email,
      role: user.role || 'user'
    };
    console.log('Generating access token at:', new Date().toISOString());
    return jwt.sign(payload, this.secret, { expiresIn: '15m' });
  },
  
  generateRefreshToken(user) {
    return jwt.sign({
      userId: user.userId || user._id
    }, this.secret + '-refresh', { expiresIn: '7d' });
  },
  
  verifyAccessToken(token) {
    return jwt.verify(token, this.secret);
  },
  
  verifyRefreshToken(token) {
    return jwt.verify(token, this.secret + '-refresh');
  }
};

export default JWTService;
