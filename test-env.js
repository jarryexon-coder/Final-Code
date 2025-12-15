const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('=== ENVIRONMENT VARIABLES ===');
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'null');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

// Test the token with this secret
const jwt = require('jsonwebtoken');
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzYzNmMwY2YwM2Q1OGFmMDQ1ZGQ0NCIsImVtYWlsIjoibmV3dXNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzY1MTYwNjQwLCJleHAiOjE3NjU3NjU0NDB9.hfccx4q1gZz47-ZmiO7pEC8O9-VzNkX7Q3fj0pAXguw";

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('\n✅ Token verified successfully!');
  console.log('User ID:', decoded.id);
  console.log('Email:', decoded.email);
} catch (err) {
  console.log('\n❌ Token verification failed:', err.message);
}
