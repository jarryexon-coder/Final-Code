const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Find where to add logging configuration (after imports)
const importSectionEnd = content.indexOf('const rateLimit = require(\'express-rate-limit\');') + 50;

const loggingConfig = `

// =============================================================================
// LOGGING CONFIGURATION
// =============================================================================

// Configure logging based on environment
const configureLogging = () => {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const isProduction = process.env.ENV_PROD === 'true';
  
  console.log(\`📊 Logging Level: \${logLevel}\`);
  console.log(\`🌍 Environment: \${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}\`);
  
  // Custom logging middleware
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Log request
    if (logLevel === 'debug' || logLevel === 'verbose') {
      console.log(\`📥 \${req.method} \${req.url} - \${req.ip}\`);
    }
    
    // Capture response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logMessage = \`📤 \${req.method} \${req.url} - \${res.statusCode} - \${duration}ms\`;
      
      // Log based on level and status code
      if (res.statusCode >= 400) {
        console.error(\`❌ \${logMessage}\`);
      } else if (logLevel === 'info' || logLevel === 'debug' || logLevel === 'verbose') {
        console.log(logMessage);
      }
    });
    
    next();
  };
};

// Apply logging middleware
app.use(configureLogging());
`;

// Insert logging configuration after imports
const updatedContent = content.substring(0, importSectionEnd) + loggingConfig + content.substring(importSectionEnd);
fs.writeFileSync('server.js', updatedContent);
console.log('✅ Added logging configuration to server.js');
