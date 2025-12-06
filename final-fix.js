const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Ensure influencer routes come after database connection
const lines = content.split('\n');
let newLines = [];

for (let i = 0; i < lines.length; i++) {
  newLines.push(lines[i]);
  
  // Look for the line after promo routes try-catch ends
  if (lines[i].includes('console.error(\'❌ Failed to load promo routes:\'')) {
    // Add a blank line
    newLines.push('');
    newLines.push('// Load influencer routes');
    newLines.push('const influencerRoutes = require(\'./routes/influencer\');');
    newLines.push('app.use(\'/api/influencer\', influencerRoutes);');
    newLines.push('console.log(\'✅ Influencer routes loaded\');');
  }
}

fs.writeFileSync('server.js', newLines.join('\n'));
console.log('✅ Final fix applied: influencer routes loaded after promo routes');
