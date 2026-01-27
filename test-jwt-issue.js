import jwt from 'jsonwebtoken';

console.log('Testing JWT timestamp generation...');
console.log('Current time (Date.now()):', Date.now());
console.log('Current time in seconds:', Math.floor(Date.now() / 1000));

const testPayload = {
  userId: 'test123',
  email: 'test@example.com',
  role: 'user'
};

const token = jwt.sign(testPayload, 'test-secret', { expiresIn: '15m' });
console.log('\nGenerated token:', token);

// Decode without verification
const decoded = jwt.decode(token);
console.log('\nDecoded token payload:');
console.log('iat:', decoded.iat, '(issued at)');
console.log('exp:', decoded.exp, '(expires at)');

// Convert to human readable
const iatDate = new Date(decoded.iat * 1000);
const expDate = new Date(decoded.exp * 1000);
console.log('\nHuman readable:');
console.log('iat:', iatDate.toISOString());
console.log('exp:', expDate.toISOString());
console.log('Current server time:', new Date().toISOString());
