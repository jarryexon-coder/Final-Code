const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Add debug middleware after regular middleware but before routes
const insertPoint = content.indexOf('// =============================================================================\n// ROUTE DECLARATIONS');
const debugMiddleware = `
// =============================================================================
// DEBUG MIDDLEWARE - Track all requests
// =============================================================================

app.use((req, res, next) => {
  console.log(\`[DEBUG] \${req.method} \${req.url} - \${new Date().toISOString()}\`);
  if (req.url.includes('influencer')) {
    console.log(\`[DEBUG INFLUENCER] Route hit: \${req.method} \${req.url}\`);
  }
  next();
});

`;

const newContent = content.slice(0, insertPoint) + debugMiddleware + content.slice(insertPoint);
fs.writeFileSync('server.js', newContent);
console.log('✅ Added debug middleware');
