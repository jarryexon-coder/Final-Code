import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

console.log('Auth Health Check:');
console.log('1. JWT_SECRET loaded:', !!process.env.JWT_SECRET);
console.log('2. Secret length:', process.env.JWT_SECRET?.length || 0);

// Test token generation and verification
const testPayload = { userId: 'health-check', test: true };
const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '1m' });

try {
  jwt.verify(token, process.env.JWT_SECRET);
  console.log('3. Token generation/verification: ✅ WORKING');
} catch (err) {
  console.log('3. Token generation/verification: ❌ FAILED', err.message);
}

console.log('4. Current server time:', new Date().toISOString());
