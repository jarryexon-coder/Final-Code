const fs = require('fs');
const content = fs.readFileSync('server.js', 'utf8');

// Split into lines
const lines = content.split('\n');

// Find key sections
let error500Start = -1;
let error500End = -1;
let error404Start = -1;
let error404End = -1;
let promoStart = -1;
let promoEnd = -1;
let influencerModuleStart = -1;
let influencerModuleEnd = -1;
let influencerDirectStart = -1;
let influencerDirectEnd = -1;

for (let i = 0; i < lines.length; i++) {
  // Find 500 error handler
  if (lines[i].includes('app.use((err, req, res, next) => {')) {
    error500Start = i;
  }
  
  // Find 404 error handler  
  if (lines[i].includes('app.use((req, res) => {') && lines[i+1] && lines[i+1].includes('Endpoint not found')) {
    error404Start = i;
  }
  
  // Find promo routes start
  if (lines[i].includes('// =============================================================================') && 
      lines[i+1] && lines[i+1].includes('PROMO ROUTES')) {
    promoStart = i;
  }
  
  // Find influencer module routes
  if (lines[i].includes('const influencerRoutes = require') || 
      lines[i].includes("app.use('/api/influencer', influencerRoutes)")) {
    if (influencerModuleStart === -1) {
      influencerModuleStart = i - 3; // Start at the comment
    }
    influencerModuleEnd = i + 1; // Include console.log
  }
  
  // Find influencer direct routes
  if (lines[i].includes('// DIRECT INFLUENCER ROUTES')) {
    influencerDirectStart = i;
  }
}

// Find end of 404 handler
if (error404Start !== -1) {
  for (let i = error404Start; i < lines.length; i++) {
    if (lines[i].trim() === '});') {
      error404End = i;
      break;
    }
  }
}

// Find end of promo routes
if (promoStart !== -1) {
  for (let i = promoStart; i < lines.length; i++) {
    if (lines[i].includes('// =============================================================================') && 
        lines[i+1] && lines[i+1].includes('DIRECT INFLUENCER ROUTES')) {
      promoEnd = i - 1;
      break;
    }
  }
}

// Find end of influencer direct routes
if (influencerDirectStart !== -1) {
  for (let i = influencerDirectStart; i < lines.length; i++) {
    if (lines[i].includes('// =============================================================================') && 
        lines[i+1] && lines[i+1].includes('MONITORING ROUTES')) {
      influencerDirectEnd = i - 1;
      break;
    }
  }
}

console.log('Found sections:');
console.log(`- 500 Error: ${error500Start} to ${error500End}`);
console.log(`- 404 Error: ${error404Start} to ${error404End}`);
console.log(`- Promo: ${promoStart} to ${promoEnd}`);
console.log(`- Influencer Module: ${influencerModuleStart} to ${influencerModuleEnd}`);
console.log(`- Influencer Direct: ${influencerDirectStart} to ${influencerDirectEnd}`);

// Rebuild in correct order
let newLines = [];

// Add everything before error handlers
for (let i = 0; i < error500Start; i++) {
  newLines.push(lines[i]);
}

// Add promo routes
if (promoStart !== -1 && promoEnd !== -1) {
  for (let i = promoStart; i <= promoEnd; i++) {
    newLines.push(lines[i]);
  }
  newLines.push(''); // Add blank line
}

// Add influencer module routes
if (influencerModuleStart !== -1 && influencerModuleEnd !== -1) {
  for (let i = influencerModuleStart; i <= influencerModuleEnd; i++) {
    newLines.push(lines[i]);
  }
  newLines.push(''); // Add blank line
}

// Add influencer direct routes  
if (influencerDirectStart !== -1 && influencerDirectEnd !== -1) {
  for (let i = influencerDirectStart; i <= influencerDirectEnd; i++) {
    newLines.push(lines[i]);
  }
  newLines.push(''); // Add blank line
}

// Add error handlers
if (error500Start !== -1 && error500End !== -1) {
  // Find end of 500 error handler
  for (let i = error500Start; i < lines.length; i++) {
    if (lines[i].trim() === '});') {
      error500End = i;
      break;
    }
  }
  
  for (let i = error500Start; i <= error500End; i++) {
    newLines.push(lines[i]);
  }
  newLines.push(''); // Add blank line
}

if (error404Start !== -1 && error404End !== -1) {
  for (let i = error404Start; i <= error404End; i++) {
    newLines.push(lines[i]);
  }
  newLines.push(''); // Add blank line
}

// Add everything after 404 handler (monitoring routes, server initialization, etc.)
for (let i = error404End + 1; i < lines.length; i++) {
  newLines.push(lines[i]);
}

// Write the fixed file
fs.writeFileSync('server.js', newLines.join('\n'));
console.log('\n✅ Fixed server.js - All routes now come BEFORE error handlers');
