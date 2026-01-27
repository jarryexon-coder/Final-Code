import jwt from 'jsonwebtoken';

console.log('=== JWT SERVICE FINAL FIX ===');
console.log('JWT_SECRET from env exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);

const JWTService = {
  // USE THE ENV VARIABLE - NO FALLBACK
  secret: process.env.JWT_SECRET,
  
  generateAccessToken(user) {
    console.log('Generating access token with ENV secret');
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    return jwt.sign({
      userId: user.userId || user._id,
      email: user.email,
      role: user.role || 'user'
    }, this.secret, { expiresIn: '15m' });
  },
  
  generateRefreshToken(user) {
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    return jwt.sign({
      userId: user.userId || user._id
    }, this.secret + '-refresh', { expiresIn: '7d' });
  },
  
  verifyAccessToken(token) {
    console.log('Verifying token with ENV secret');
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    return jwt.verify(token, this.secret);
  },
  
  verifyRefreshToken(token) {
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    return jwt.verify(token, this.secret + '-refresh');
  },
  
  generateResetToken(email) {
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    return jwt.sign(
      { email, purpose: 'password_reset' },
      this.secret + '-reset',
      { expiresIn: '1h' }
    );
  },
  
  verifyResetToken(token) {
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    return jwt.verify(token, this.secret + '-reset');
  }
};

export default JWTService;
