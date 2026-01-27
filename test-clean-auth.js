// Test with a clean import
import jwt from 'jsonwebtoken';

console.log('=== CLEAN AUTH TEST ===');

// Same as your JWT service
const secret = 'test-secret-key-for-now';

// Test verification function
function verifyAccessToken(token) {
  return jwt.verify(token, secret);
}

// Your current token
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTc3NDNlNDgxZWZkNzkzZmM2MzRmMDMiLCJlbWFpbCI6ImZpbmFsLXRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTQzMDczNSwiZXhwIjoxNzY5NDMxNjM1fQ.HiL0skMxBBDO3xsbLl9UNfOn6D3bQEWd-_gdZBHxyxM";

console.log('Testing token verification...');
try {
  const decoded = verifyAccessToken(token);
  console.log('✅ SUCCESS! Token verified.');
  console.log('User ID:', decoded.userId);
  console.log('Token is valid until:', new Date(decoded.exp * 1000).toISOString());
} catch (error) {
  console.log('❌ FAILED:', error.message);
  console.log('Full error:', error);
}
