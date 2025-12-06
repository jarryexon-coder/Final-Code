const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Find and remove the old debug middleware that adds [DEBUG] lines
const debugMiddlewareStart = content.indexOf('// =============================================================================\n// DEBUG MIDDLEWARE - Track all requests');
if (debugMiddlewareStart !== -1) {
    // Find the end of this middleware (look for the next middleware or route)
    const debugMiddlewareEnd = content.indexOf('// =============================================================================', debugMiddlewareStart + 10);
    
    const beforeDebug = content.substring(0, debugMiddlewareStart);
    const afterDebug = content.substring(debugMiddlewareEnd);
    
    fs.writeFileSync('server.js', beforeDebug + afterDebug);
    console.log('✅ Removed duplicate debug middleware');
} else {
    console.log('⚠️ Old debug middleware not found (may have been already removed)');
}
