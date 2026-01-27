import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTc3NDNlNDgxZWZkNzkzZmM2MzRmMDMiLCJlbWFpbCI6ImZpbmFsLXRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTQzMDczNSwiZXhwIjoxNzY5NDMxNjM1fQ.HiL0skMxBBDO3xsbLl9UNfOn6D3bQEWd-_gdZBHxyxM";

console.log('JWT_SECRET from .env:', process.env.JWT_SECRET ? 'Set (' + process.env.JWT_SECRET.length + ' chars)' : 'Not set');

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('✅ Token verified with JWT_SECRET env variable!');
  console.log('User:', decoded.userId);
} catch (err) {
  console.log('❌ Still fails with JWT_SECRET:', err.message);
  
  // Try some variations
  console.log('\nTrying variations...');
  const variations = [
    process.env.JWT_SECRET,
    process.env.JWT_SECRET?.trim(),
    '978c37492913b1c9c.',  // From your .env
    '978c37492913b1c9c',   // Without trailing dot
  ];
  
  variations.forEach((secret, i) => {
    if (!secret) return;
    try {
      jwt.verify(token, secret);
      console.log(`✅ Variation ${i} works!`);
    } catch (e) {
      console.log(`❌ Variation ${i} fails`);
    }
  });
}
