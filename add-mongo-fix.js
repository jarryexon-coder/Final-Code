const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Check if mongoose is already imported
if (!content.includes('const mongoose = require(\'mongoose\')') && 
    !content.includes('import mongoose from \'mongoose\'')) {
  
  // Find the first require/import section and add mongoose
  const lines = content.split('\n');
  let insertIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('require(') || lines[i].includes('import ') || i > 20) {
      insertIndex = i;
      break;
    }
  }
  
  // Add mongoose import
  lines.splice(insertIndex, 0, 'const mongoose = require(\'mongoose\');');
  content = lines.join('\n');
  console.log('✅ Added mongoose import');
}

// Check if mongoose.connect exists
if (!content.includes('mongoose.connect')) {
  // Find a good place to add connection (after imports, before routes)
  const importEnd = content.indexOf('const app = express()') || content.indexOf('app.use(');
  
  const mongoCode = `

// ====================
// MONGODB CONNECTION
// ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sports-app';

console.log('🔌 Connecting to MongoDB at:', MONGODB_URI.replace(/:[^:]*@/, ':****@'));

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

// Global database connection check
global.isMongoConnected = false;
mongoose.connection.on('connected', () => {
  global.isMongoConnected = true;
  console.log('✅ MongoDB is ready for queries');
});
mongoose.connection.on('disconnected', () => {
  global.isMongoConnected = false;
});
`;

  // Insert after the last import
  const insertAt = content.indexOf('const app = express()');
  if (insertAt > -1) {
    content = content.slice(0, insertAt) + mongoCode + content.slice(insertAt);
    console.log('✅ Added MongoDB connection code');
  } else {
    // Try to insert near the top
    content = mongoCode + '\n' + content;
    console.log('✅ Added MongoDB connection code at beginning');
  }
}

// Also fix the health check endpoint to show actual MongoDB status
if (content.includes('res.json({ status:\'healthy\'')) {
  const healthCheckFix = `
  // Updated health check with real MongoDB status
  const mongoStatus = global.isMongoConnected ? 'connected' : 'disconnected';
  
  res.json({ 
    status: 'healthy', 
    service: 'NBA Fantasy AI Backend',
    version: '4.2.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    databases: {
      mongodb: mongoStatus,
      mongoConnection: global.isMongoConnected ? '✅' : '❌'
    }
  });
  `;
  
  // Replace simple health check
  content = content.replace(
    /res\.json\(\{ status:'healthy'.*?\}\);/s,
    healthCheckFix
  );
  console.log('✅ Updated health check endpoint');
}

fs.writeFileSync('server.js', content);
console.log('🎉 MongoDB fix applied to server.js');
