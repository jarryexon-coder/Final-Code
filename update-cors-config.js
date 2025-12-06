const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Update the CORS configuration section
const newCorsConfig = `// =============================================================================
// CORS MIDDLEWARE (dynamically configured based on environment)
// =============================================================================

// Parse ALLOWED_ORIGINS from environment variable or use default
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : [
    'http://localhost:8081', 
    'http://10.0.0.183:8081', 
    'exp://10.0.0.183:8081',
    'http://localhost:19000',
    'http://localhost:19006', 
    'http://10.0.0.183:19000',
    'http://10.0.0.183:19006',
    'exp://10.0.0.183:19000',
    'https://*.exp.direct',
    'https://*.expo.dev'
  ];

// Add FRONTEND_URL if present
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

console.log(\`🔒 CORS Configuration: \${process.env.ENV_PROD === 'true' ? 'PRODUCTION' : 'DEVELOPMENT'}\`);
console.log(\`🌐 Allowed Origins: \${allowedOrigins.length} origins configured\`);

if (process.env.ENV_PROD === 'true') {
  console.log('⚠️  Running in PRODUCTION mode - CORS is strict');
} else {
  console.log('🔧 Running in DEVELOPMENT mode - CORS is permissive');
}

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For development, be more permissive
    if (process.env.ENV_PROD !== 'true') {
      console.log(\`🔧 Development: Allowing origin \${origin}\`);
      return callback(null, true);
    }
    
    // In production, block unauthorized origins
    console.log(\`🚫 Production: Blocked origin \${origin}\`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));`;

// Find and replace the current CORS configuration
const corsStart = content.indexOf('// =============================================================================\n// CORS MIDDLEWARE');
const corsEnd = content.indexOf('app.use(cors({', corsStart);
const corsSectionEnd = content.indexOf('}));', corsEnd) + 4;

if (corsStart !== -1 && corsEnd !== -1) {
  const beforeCors = content.substring(0, corsStart);
  const afterCors = content.substring(corsSectionEnd);
  const updatedContent = beforeCors + newCorsConfig + afterCors;
  
  fs.writeFileSync('server.js', updatedContent);
  console.log('✅ Updated CORS configuration in server.js');
} else {
  console.log('❌ Could not find CORS configuration to update');
}
