import jwt from 'jsonwebtoken';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTc3NDNlNDgxZWZkNzkzZmM2MzRmMDMiLCJlbWFpbCI6ImZpbmFsLXRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTQzMDczNSwiZXhwIjoxNzY5NDMxNjM1fQ.HiL0skMxBBDO3xsbLl9UNfOn6D3bQEWd-_gdZBHxyxM";
const secret = 'test-secret-key-for-now';

console.log('=== DEBUGGING TOKEN VERIFICATION ===');
console.log('Token:', token.substring(0, 50) + '...');
console.log('Secret used:', secret);

// 1. First decode without verification
console.log('\n1. Decoding (without verification):');
const decoded = jwt.decode(token);
console.log('Decoded payload:', JSON.stringify(decoded, null, 2));

// 2. Try verification with hardcoded secret
console.log('\n2. Verifying with hardcoded secret:');
try {
  const verified = jwt.verify(token, secret);
  console.log('✅ SUCCESS: Token verified!');
  console.log('Verified payload:', JSON.stringify(verified, null, 2));
  
  // Check timestamps
  const now = Math.floor(Date.now() / 1000);
  console.log('\nTimestamp check:');
  console.log('Current time (seconds):', now);
  console.log('Token iat (issued at):', decoded.iat);
  console.log('Token exp (expires at):', decoded.exp);
  console.log('Time until expiry:', decoded.exp - now, 'seconds');
  
  if (decoded.exp < now) {
    console.log('⚠️ WARNING: Token is expired!');
  }
} catch (err) {
  console.log('❌ FAILED:', err.message);
  console.log('Error name:', err.name);
}

// 3. Check if there's an env variable conflict
console.log('\n3. Checking environment:');
console.log('JWT_SECRET env variable:', process.env.JWT_SECRET ? 'Set' : 'Not set');

if (process.env.JWT_SECRET) {
  console.log('Trying with JWT_SECRET...');
  try {
    const verifiedWithEnv = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Works with JWT_SECRET env variable!');
  } catch (err) {
    console.log('❌ Does NOT work with JWT_SECRET:', err.message);
  }
}

// 4. Try with refresh secret pattern
console.log('\n4. Trying with refresh secret pattern:');
try {
  const withRefreshSecret = jwt.verify(token, secret + '-refresh');
  console.log('✅ Works with refresh secret pattern!');
} catch (err) {
  console.log('❌ Does NOT work with refresh secret pattern:', err.message);
}
