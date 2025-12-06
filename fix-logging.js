const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Remove the problematic logging configuration (lines 27-60)
// Find the logging section
const loggingStart = content.indexOf('// =============================================================================\n// LOGGING CONFIGURATION');
const loggingEnd = content.indexOf('// Apply logging middleware\napp.use(configureLogging());');

if (loggingStart !== -1 && loggingEnd !== -1) {
    // Find the end of the logging section (after the closing brace)
    const sectionEnd = content.indexOf('\n\n', loggingEnd + 50) + 2;
    
    // Remove the entire logging section
    const beforeLogging = content.substring(0, loggingStart);
    const afterLogging = content.substring(sectionEnd);
    content = beforeLogging + afterLogging;
    
    console.log('✅ Removed problematic logging configuration');
}

// Now add a simpler, working logging middleware
const simpleLogging = `

// =============================================================================
// SIMPLE LOGGING MIDDLEWARE
// =============================================================================

app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(\`📥 \${req.method} \${req.originalUrl} - \${new Date().toISOString()}\`);
  
  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(\`📤 \${req.method} \${req.originalUrl} - \${res.statusCode} - \${duration}ms\`);
  });
  
  next();
});
`;

// Insert simple logging after CORS middleware
const corsEnd = content.indexOf('}));\n\n// =============================================================================');
const updatedContent = content.substring(0, corsEnd + 4) + simpleLogging + content.substring(corsEnd + 4);

fs.writeFileSync('server.js', updatedContent);
console.log('✅ Added simple logging middleware');
