import jwt from 'jsonwebtoken';

console.log('=== TESTING ALL POSSIBLE SECRETS ===');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTc3NDNlNDgxZWZkNzkzZmM2MzRmMDMiLCJlbWFpbCI6ImZpbmFsLXRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTQzMDczNSwiZXhwIjoxNzY5NDMxNjM1fQ.HiL0skMxBBDO3xsbLl9UNfOn6D3bQEWd-_gdZBHxyxM";

const possibleSecrets = [
  'test-secret-key-for-now',
  'nba-fantasy-secret-key-change-in-production',
  process.env.JWT_SECRET,
  'test-secret-key-for-now-refresh',
  'test-secret-key-for-now-reset'
].filter(s => s); // Remove undefined

console.log('Testing token with', possibleSecrets.length, 'possible secrets:');

possibleSecrets.forEach((secret, i) => {
  try {
    const decoded = jwt.verify(token, secret);
    console.log(`✅ SECRET ${i+1} WORKS: "${secret.substring(0, 15)}..."`);
    console.log('   Decoded:', decoded.userId);
  } catch (err) {
    console.log(`❌ Secret ${i+1} fails: "${secret?.substring(0, 15) || 'undefined'}..." - ${err.message}`);
  }
});
