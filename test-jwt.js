const jwt = require('jsonwebtoken');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzYzNmMwY2YwM2Q1OGFmMDQ1ZGQ0NCIsImVtYWlsIjoibmV3dXNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzY1MTYwNjQwLCJleHAiOjE3NjU3NjU0NDB9.hfccx4q1gZz47-ZmiO7pEC8O9-VzNkX7Q3fj0pAXguw";

console.log("Testing JWT token with different secrets...");

// Try the secrets from your code
const secrets = [
  'your-secret-key',
  'your-super-secret-jwt-key-change-this-in-production',
  'dev-secret',
  'development',
  'secret'
];

secrets.forEach(secret => {
  try {
    const decoded = jwt.verify(token, secret);
    console.log(`✅ SUCCESS with secret: "${secret}"`);
    console.log(`   Decoded:`, decoded);
  } catch (err) {
    console.log(`❌ Failed with secret: "${secret}" - ${err.message}`);
  }
});
