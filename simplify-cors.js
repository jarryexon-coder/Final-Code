const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Find the CORS configuration
const corsStart = content.indexOf('// =============================================================================\n// CORS MIDDLEWARE');
if (corsStart === -1) {
    console.log('CORS configuration not found');
    process.exit(1);
}

// Find the end of CORS configuration
const corsEnd = content.indexOf('}));', corsStart) + 4;

// Create a simpler CORS configuration
const simpleCors = `
// =============================================================================
// CORS MIDDLEWARE
// =============================================================================

// Default origins for development
const defaultOrigins = [
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

// Get allowed origins from environment or use defaults
let allowedOrigins = defaultOrigins;
if (process.env.ALLOWED_ORIGINS) {
  allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
}

// Add FRONTEND_URL if provided
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

console.log('🔒 CORS Configuration:');
console.log('Allowed origins:', allowedOrigins.length, 'origins');

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
`;

// Replace the CORS configuration
const beforeCors = content.substring(0, corsStart);
const afterCors = content.substring(corsEnd);
const updatedContent = beforeCors + simpleCors + afterCors;

fs.writeFileSync('server.js', updatedContent);
console.log('✅ Simplified CORS configuration');
