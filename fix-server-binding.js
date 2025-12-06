const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverFile, 'utf8');

// Find and replace the listen call
// Look for patterns like: app.listen(PORT, ...
// or app.listen(PORT, '0.0.0.0', ...
// We want to ensure it's listening on 0.0.0.0

// First, let's find all listen calls
const listenRegex = /app\.listen\(([^)]+)\)/g;
let matches;
let newContent = content;

while ((matches = listenRegex.exec(content)) !== null) {
  const fullMatch = matches[0];
  const args = matches[1];
  
  console.log('Found listen call:', fullMatch);
  
  // Check if it already has '0.0.0.0'
  if (args.includes("'0.0.0.0'") || args.includes('"0.0.0.0"')) {
    console.log('✅ Already binding to 0.0.0.0');
  } else {
    // Check if it has a specific IP
    const ipRegex = /['"](?:[0-9]{1,3}\.){3}[0-9]{1,3}['"]/;
    if (ipRegex.test(args)) {
      console.log('⚠️ Binding to specific IP, will change to 0.0.0.0');
      // Replace the IP with '0.0.0.0'
      newContent = newContent.replace(fullMatch, fullMatch.replace(ipRegex, "'0.0.0.0'"));
    } else {
      // No IP specified, add '0.0.0.0' as the second argument
      console.log('⚠️ No IP specified, adding 0.0.0.0');
      const newArgs = args.replace(/(PORT\s*,)/, "$1 '0.0.0.0',");
      newContent = newContent.replace(fullMatch, `app.listen(${newArgs})`);
    }
  }
}

// If we didn't find a pattern, let's add a simple server at the end
if (newContent === content) {
  console.log('No listen call found, adding one...');
  // Find where the server is started
  const lines = content.split('\n');
  let lastLineIndex = -1;
  
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('app.listen') || lines[i].includes('server.listen')) {
      lastLineIndex = i;
      break;
    }
  }
  
  if (lastLineIndex === -1) {
    // Add at the end before any module.exports
    const exportIndex = content.lastIndexOf('module.exports');
    if (exportIndex !== -1) {
      const beforeExport = content.substring(0, exportIndex);
      const afterExport = content.substring(exportIndex);
      newContent = beforeExport + "\n\n// Start server\napp.listen(PORT, '0.0.0.0', () => {\n  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);\n});\n\n" + afterExport;
    } else {
      newContent = content + "\n\n// Start server\napp.listen(PORT, '0.0.0.0', () => {\n  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);\n});\n";
    }
  }
}

fs.writeFileSync(serverFile, newContent);
console.log('✅ Updated server.js to bind to 0.0.0.0');
