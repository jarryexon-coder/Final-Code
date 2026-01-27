import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== FINAL TEST ===');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Loaded' : 'NOT loaded');

// Generate a token with the env secret
const testPayload = { userId: 'test123', email: 'test@test.com' };
const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '15m' });

console.log('\nGenerated token:', token.substring(0, 50) + '...');

// Verify it
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('✅ Self-verification works!');
  console.log('iat:', decoded.iat, '->', new Date(decoded.iat * 1000).toISOString());
} catch (err) {
  console.log('❌ Self-verification failed:', err.message);
}
