const fs = require('fs');

// Read the server.js file
let content = fs.readFileSync('server.js', 'utf8');

// Find and replace the MongoDB connection
// Look for mongoose.connect with options and remove the options
const oldPattern = /await mongoose\.connect\(process\.env\.MONGODB_URI,\s*\{[^}]+\}\)/;
const newConnection = "await mongoose.connect(process.env.MONGODB_URI)";

if (oldPattern.test(content)) {
  content = content.replace(oldPattern, newConnection);
  fs.writeFileSync('server.js', content);
  console.log('✅ Fixed MongoDB connection - removed deprecated options');
} else {
  console.log('⚠️  MongoDB connection pattern not found. Checking for other patterns...');
  
  // Try another common pattern
  const pattern2 = /mongoose\.connect\(process\.env\.MONGODB_URI,\s*\{[^}]+\}\)/;
  if (pattern2.test(content)) {
    content = content.replace(pattern2, "mongoose.connect(process.env.MONGODB_URI)");
    fs.writeFileSync('server.js', content);
    console.log('✅ Fixed MongoDB connection (pattern 2)');
  } else {
    console.log('❌ Could not find MongoDB connection to fix');
    console.log('Please manually remove useNewUrlParser and useUnifiedTopology options');
  }
}
