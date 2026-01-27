import jwt from 'jsonwebtoken';

// Test with the hardcoded secret
const testPayload = { userId: 'test', email: 'test@test.com' };
const hardcodedSecret = 'test-secret-key-for-now';

console.log('Testing JWT verification...');
const token = jwt.sign(testPayload, hardcodedSecret, { expiresIn: '15m' });
console.log('Token generated with hardcoded secret:', token.substring(0, 50) + '...');

// Try to verify with the same secret
try {
  const decoded = jwt.verify(token, hardcodedSecret);
  console.log('✓ Verified successfully with hardcoded secret');
} catch (err) {
  console.log('✗ Failed to verify with hardcoded secret:', err.message);
}

// Check if environment variable is different
if (process.env.JWT_SECRET) {
  console.log('\nJWT_SECRET env variable exists');
  try {
    const decoded2 = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✓ Verified successfully with env JWT_SECRET');
  } catch (err) {
    console.log('✗ Failed to verify with env JWT_SECRET:', err.message);
  }
} else {
  console.log('\nNo JWT_SECRET env variable found');
}
