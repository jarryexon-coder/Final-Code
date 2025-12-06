const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverFile, 'utf8');

// Find the CORS configuration
const corsConfig = `// CORS Configuration - Updated for development
app.use(cors({
  origin: ['http://localhost:8081', 'http://10.0.0.183:8081', 'exp://10.0.0.183:8081', 'http://localhost:19006', 'http://localhost:19000', 'http://localhost:3000', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));`;

// Replace the CORS section
content = content.replace(/app\.use\(cors.*?\);?/s, corsConfig);

// Also add a simple middleware to log requests
const loggingMiddleware = `// Request logging middleware
app.use((req, res, next) => {
  console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url} from \${req.ip}\`);
  next();
});`;

// Insert after CORS
content = content.replace(corsConfig, corsConfig + '\n\n' + loggingMiddleware);

fs.writeFileSync(serverFile, content);
console.log('✅ Updated CORS configuration in server.js');
