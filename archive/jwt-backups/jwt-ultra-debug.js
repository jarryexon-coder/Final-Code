import jwt from 'jsonwebtoken';

console.log('=== ULTRA DEBUG JWT SERVICE ===');
console.log('Loading at:', new Date().toISOString());

const JWTService = {
  secret: 'test-secret-key-for-now',
  
  generateAccessToken(user) {
    console.log('\n=== GENERATING ACCESS TOKEN ===');
    console.log('User:', user.email || user.userId);
    console.log('Using secret:', this.secret);
    console.log('Secret length:', this.secret.length);
    console.log('Secret first 10 chars:', this.secret.substring(0, 10));
    
    const payload = {
      userId: user.userId || user._id,
      email: user.email,
      role: user.role || 'user'
    };
    
    console.log('Payload:', payload);
    const token = jwt.sign(payload, this.secret, { expiresIn: '15m' });
    console.log('Generated token:', token);
    
    // Also decode it to show what we created
    const decoded = jwt.decode(token);
    console.log('Decoded token iat:', decoded.iat);
    console.log('Decoded token exp:', decoded.exp);
    
    return token;
  },
  
  generateRefreshToken(user) {
    console.log('\n=== GENERATING REFRESH TOKEN ===');
    console.log('Using refresh secret:', this.secret + '-refresh');
    return jwt.sign({
      userId: user.userId || user._id
    }, this.secret + '-refresh', { expiresIn: '7d' });
  },
  
  verifyAccessToken(token) {
    console.log('\n=== VERIFYING ACCESS TOKEN ===');
    console.log('Token to verify:', token.substring(0, 50) + '...');
    console.log('Using secret for verification:', this.secret);
    console.log('Secret length:', this.secret.length);
    
    try {
      const decoded = jwt.verify(token, this.secret);
      console.log('✅ Verification SUCCESS!');
      console.log('Decoded user:', decoded.userId);
      return decoded;
    } catch (err) {
      console.log('❌ Verification FAILED:', err.message);
      console.log('Error details:', err);
      throw err;
    }
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
