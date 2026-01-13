import fs from 'fs';

const content = fs.readFileSync('server.js', 'utf8');
console.log("=== Checking server.js ===");

// Check for key endpoints
const endpoints = [
  'app.get(\'/api/health\'',
  'app.get(\'/health\'',
  'app.get(\'/privacy\'',
  'app.get(\'/api/database/health\''
];

endpoints.forEach(endpoint => {
  if (content.includes(endpoint)) {
    console.log(`✅ Found: ${endpoint}`);
  } else {
    console.log(`❌ Missing: ${endpoint}`);
  }
});

// Check MongoDB connection
if (content.includes('mongoose.connect')) {
  console.log('✅ MongoDB connection code present');
} else {
  console.log('❌ MongoDB connection code missing');
}

// Check Redis connection  
if (content.includes('new Redis')) {
  console.log('✅ Redis connection code present');
} else {
  console.log('❌ Redis connection code missing');
}
