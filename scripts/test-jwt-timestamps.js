// scripts/test-jwt-timestamps.js
import jwt from 'jsonwebtoken';

console.log('🔍 DIAGNOSING JWT TIMESTAMP ISSUE');
console.log('=================================\n');

// Test 1: Check current system time
console.log('1. System Time Check:');
console.log('   Current time (ms):', Date.now());
console.log('   Current time (seconds):', Math.floor(Date.now() / 1000));
console.log('   Current ISO string:', new Date().toISOString());
console.log('   Your local time:', new Date().toString(), '\n');

// Test 2: Create a test JWT
console.log('2. Creating Test JWT:');
const testPayload = {
  userId: 'test123',
  email: 'test@example.com'
};

const testToken = jwt.sign(testPayload, 'test-secret', {
  expiresIn: '15m'
});

console.log('   Token created:', testToken.substring(0, 50) + '...\n');

// Test 3: Decode and check timestamps
console.log('3. Decoding Token Timestamps:');
const decoded = jwt.decode(testToken);
console.log('   iat (issued at):', decoded.iat);
console.log('   iat as Date:', new Date(decoded.iat * 1000).toString());
console.log('   exp (expires at):', decoded.exp);
console.log('   exp as Date:', new Date(decoded.exp * 1000).toString());

const now = Math.floor(Date.now() / 1000);
console.log('   Current time (seconds):', now);
console.log('   iat vs now:', decoded.iat === now ? '✅ Same' : '❌ Different');
console.log('   Difference (seconds):', decoded.iat - now);

if (decoded.iat > now) {
  console.log('\n⚠️  PROBLEM DETECTED: iat is in the FUTURE!');
  console.log('   Future by:', decoded.iat - now, 'seconds');
  console.log('   That\'s', (decoded.iat - now) / 3600, 'hours in the future');
} else if (decoded.iat < now) {
  console.log('\n✅ iat is in the PAST (correct)');
  console.log('   Past by:', now - decoded.iat, 'seconds');
} else {
  console.log('\n✅ iat is exactly NOW (correct)');
}

// Test 4: Verify your actual JWT service
console.log('\n4. Testing Your JWT Service:');
try {
  const jwtService = await import('../utils/jwt.js');
  const service = jwtService.default;
  
  const user = {
    _id: 'test123',
    email: 'service-test@example.com',
    role: 'user',
    name: 'Test User'
  };
  
  const accessToken = service.generateAccessToken(user);
  const decodedAccess = jwt.decode(accessToken);
  
  console.log('   Your service iat:', decodedAccess.iat);
  console.log('   Expected iat:', now);
  console.log('   Difference:', decodedAccess.iat - now, 'seconds');
  
} catch (error) {
  console.log('   Could not test JWT service:', error.message);
}
