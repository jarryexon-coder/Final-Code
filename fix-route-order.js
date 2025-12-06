const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');
const lines = content.split('\n');

// Find the positions
let influencerLine = -1;
let notFoundLine = -1;
let errorHandlerLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('app.use(\'/api/influencer\'')) {
    influencerLine = i;
  }
  if (lines[i].includes('app.use((req, res) => {') && lines[i+1] && lines[i+1].includes('Endpoint not found')) {
    notFoundLine = i;
  }
  if (lines[i].includes('app.use((err, req, res, next) => {')) {
    errorHandlerLine = i;
  }
}

console.log('Found:');
console.log(`- Influencer routes at line: ${influencerLine}`);
console.log(`- 404 handler at line: ${notFoundLine}`);
console.log(`- Error handler at line: ${errorHandlerLine}`);

if (influencerLine > notFoundLine) {
  console.log('❌ PROBLEM: Influencer routes are AFTER 404 handler!');
  
  // Extract influencer routes section (including the comment block above it)
  let influencerStart = influencerLine - 5;
  while (influencerStart > 0 && !lines[influencerStart].includes('// =======')) {
    influencerStart--;
  }
  
  let influencerEnd = influencerLine + 2; // Include the line after console.log
  while (influencerEnd < lines.length && !lines[influencerEnd].includes('// =======')) {
    influencerEnd++;
  }
  
  // Extract the section
  const influencerSection = lines.slice(influencerStart, influencerEnd + 1);
  
  // Remove it from original position
  lines.splice(influencerStart, influencerEnd - influencerStart + 1);
  
  // Find where to insert it (before the 404 handler)
  const insertPosition = notFoundLine;
  
  // Insert it
  lines.splice(insertPosition, 0, ...influencerSection);
  
  // Also need to move the 404 handler to after ALL routes
  // For now, just fix the immediate problem
  fs.writeFileSync('server.js', lines.join('\n'));
  console.log('✅ Fixed: Moved influencer routes before 404 handler');
} else {
  console.log('✅ Routes are in correct order');
}
