const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Remove ANY options from mongoose.connect
content = content.replace(
  /mongoose\.connect\([^)]*,\s*\{[^}]+\}\)/g,
  'mongoose.connect(process.env.MONGODB_URI)'
);

// Also fix await patterns
content = content.replace(
  /await mongoose\.connect\([^)]*,\s*\{[^}]+\}\)/g,
  'await mongoose.connect(process.env.MONGODB_URI)'
);

fs.writeFileSync('server.js', content);
console.log('✅ MongoDB connection completely cleaned');
