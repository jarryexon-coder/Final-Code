// test-env.js
import dotenv from 'dotenv';
dotenv.config();

console.log('=== Environment Variables ===');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI starts with:', process.env.MONGODB_URI?.substring(0, 50) + '...');
console.log('BALLDONTLIE_API_KEY exists:', !!process.env.BALLDONTLIE_API_KEY);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
