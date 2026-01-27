import jwtService from './utils/jwt.js';

console.log('=== DEBUG JWT SERVICE ===');
console.log('JWT Service object:', Object.keys(jwtService));

// Check the secret
console.log('Secret property:', jwtService.secret);
console.log('Secret length:', jwtService.secret?.length);
console.log('Secret type:', typeof jwtService.secret);

// Test generating a token
const testUser = {
  userId: 'test123',
  email: 'test@test.com',
  role: 'user'
};

console.log('\nGenerating test token...');
const testToken = jwtService.generateAccessToken(testUser);
console.log('Test token generated:', testToken.substring(0, 50) + '...');

// Try to verify it
console.log('\nVerifying test token...');
try {
  const decoded = jwtService.verifyAccessToken(testToken);
  console.log('✅ Test token verified successfully!');
  console.log('Decoded:', decoded);
} catch (err) {
  console.log('❌ Test token verification failed:', err.message);
}

// Now test with your actual token
console.log('\nTesting with your actual token...');
const yourToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTc3NDNlNDgxZWZkNzkzZmM2MzRmMDMiLCJlbWFpbCI6ImZpbmFsLXRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTQzMDczNSwiZXhwIjoxNzY5NDMxNjM1fQ.HiL0skMxBBDO3xsbLl9UNfOn6D3bQEWd-_gdZBHxyxM";
try {
  const decodedYour = jwtService.verifyAccessToken(yourToken);
  console.log('✅ Your token verified successfully!');
} catch (err) {
  console.log('❌ Your token verification failed:', err.message);
}
