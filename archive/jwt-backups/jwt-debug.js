import jwt from 'jsonwebtoken';

console.log('=== DEBUG: Loading jwt-debug.js ===');
console.log('Module loading time:', new Date().toISOString());
console.log('Current timestamp (seconds):', Math.floor(Date.now() / 1000));

const JWTService = {
  secret: 'test-secret-key-for-now',
  
  generateAccessToken(user) {
    console.log('=== DEBUG: generateAccessToken called ===');
    console.log('Call time:', new Date().toISOString());
    console.log('Call timestamp (seconds):', Math.floor(Date.now() / 1000));
    
    const payload = {
      userId: user.userId || user._id,
      email: user.email,
      role: user.role || 'user'
    };
    
    console.log('Payload before sign:', payload);
    const token = jwt.sign(payload, this.secret, { expiresIn: '15m' });
    const decoded = jwt.decode(token);
    console.log('Token generated - iat:', decoded.iat);
    console.log('Token iat as date:', new Date(decoded.iat * 1000).toISOString());
    
    return token;
  },
  
  generateRefreshToken(user) {
    console.log('=== DEBUG: generateRefreshToken called ===');
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
