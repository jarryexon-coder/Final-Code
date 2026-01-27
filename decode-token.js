// decode-token.js
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTc3NDNlNDgxZWZkNzkzZmM2MzRmMDMiLCJlbWFpbCI6ImZpbmFsLXRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTQyNDc1NywiZXhwIjoxNzY5NDI1NjU3fQ.2lpuaL1J6Rpvg2gCcKtESF4tQAIUZgfelBSGN6G8QtY';

// Decode without verification
const base64Url = token.split('.')[1];
const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
const payload = JSON.parse(Buffer.from(base64, 'base64').toString());

console.log('🔍 DECODING YOUR ACTUAL TOKEN:');
console.log('==============================\n');

console.log('Token payload:', JSON.stringify(payload, null, 2));

const iatDate = new Date(payload.iat * 1000);
const expDate = new Date(payload.exp * 1000);
const now = new Date();

console.log('\n📅 TIMESTAMP ANALYSIS:');
console.log('iat (issued at):', payload.iat);
console.log('iat as Date:', iatDate.toString());
console.log('iat as ISO:', iatDate.toISOString());

console.log('\nexp (expires at):', payload.exp);
console.log('exp as Date:', expDate.toString());
console.log('exp as ISO:', expDate.toISOString());

console.log('\n⏰ CURRENT TIME:');
console.log('Now (Date):', now.toString());
console.log('Now (ISO):', now.toISOString());
console.log('Now (seconds):', Math.floor(now.getTime() / 1000));

console.log('\n📊 TIME DIFFERENCES:');
console.log('iat vs now (seconds):', payload.iat - Math.floor(now.getTime() / 1000));
console.log('iat vs now (minutes):', (payload.iat - Math.floor(now.getTime() / 1000)) / 60);

console.log('\n⏳ TOKEN VALIDITY:');
console.log('Token expires in (seconds):', payload.exp - Math.floor(now.getTime() / 1000));
console.log('Token expires in (minutes):', (payload.exp - Math.floor(now.getTime() / 1000)) / 60);

// Check if token is already expired (negative expiry time)
if (payload.exp < Math.floor(now.getTime() / 1000)) {
  console.log('\n❌ TOKEN IS ALREADY EXPIRED!');
} else if (payload.iat > Math.floor(now.getTime() / 1000)) {
  console.log('\n⚠️  TOKEN HAS FUTURE iat (issued at timestamp)!');
  console.log('This is why verification is failing.');
} else {
  console.log('\n✅ Token timestamps look correct');
}
