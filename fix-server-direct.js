const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Remove the try-catch block for influencer routes
const lines = content.split('\n');
let newLines = [];
let inInfluencerTryCatch = false;
let skipNextLines = 0;

for (let i = 0; i < lines.length; i++) {
  if (skipNextLines > 0) {
    skipNextLines--;
    continue;
  }
  
  if (lines[i].includes('// =============================================================================') && 
      lines[i+1] && lines[i+1].includes('INFLUENCER ROUTES')) {
    // Found influencer routes section
    newLines.push(lines[i]); // =======
    newLines.push(lines[i+1]); // INFLUENCER ROUTES
    newLines.push(lines[i+2]); // =======
    
    // Skip the try-catch block
    inInfluencerTryCatch = true;
    skipNextLines = 7; // Skip 7 lines (try, require, app.use, console.log, } catch, console.error, })
    continue;
  }
  
  if (!inInfluencerTryCatch || (inInfluencerTryCatch && !skipNextLines)) {
    newLines.push(lines[i]);
  }
}

// Now add the influencer routes directly without try-catch
for (let i = 0; i < newLines.length; i++) {
  if (newLines[i].includes('// INFLUENCER ROUTES') && newLines[i+2].includes('// =======')) {
    // Insert the routes after the comment block
    newLines.splice(i+3, 0, '');
    newLines.splice(i+4, 0, 'const influencerRoutes = require(\'./routes/influencer\');');
    newLines.splice(i+5, 0, 'app.use(\'/api/influencer\', influencerRoutes);');
    newLines.splice(i+6, 0, 'console.log(\'✅ Influencer routes loaded directly\');');
    break;
  }
}

fs.writeFileSync('server.js', newLines.join('\n'));
console.log('✅ Updated server.js with direct influencer routes (no try-catch)');
