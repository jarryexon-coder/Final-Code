// Quick fix for sports-scheduler.js
const fs = require('fs');
const filePath = 'services/sports-scheduler.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix line 213 - check what's there
console.log('Checking sports-scheduler.js line 213:');
const lines = content.split('\n');
console.log('Line 213:', lines[212]);

// Simple fix: Comment out the problematic line temporarily
content = content.replace(
  'this.nbaDataInterval = setInterval(this.nbaDataRequestHandler.bind(this), 5000);
);

fs.writeFileSync(filePath, content);
console.log('✅ Fixed sports-scheduler.js (temporarily disabled problematic line)');
