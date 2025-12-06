const fs = require('fs');
const path = require('path');

console.log('🔍 Searching for ALL missing modules...');

// Read server.js
const serverContent = fs.readFileSync('server.js', 'utf8');

// Find all require statements
const requireRegex = /require\(['"](\.\/[^'"]+)['"]\)/g;
let match;
const requires = new Set();

while ((match = requireRegex.exec(serverContent)) !== null) {
  requires.add(match[1]);
}

console.log('\n📋 All local require statements found:');
const missing = [];
const found = [];

requires.forEach(req => {
  // Check if file exists
  let filePath = req;
  if (!req.endsWith('.js')) {
    filePath = req + '.js';
  }
  
  if (fs.existsSync(filePath)) {
    found.push(req);
  } else {
    missing.push(req);
  }
});

console.log('\n✅ Found modules:');
found.forEach(req => console.log('  ', req));

console.log('\n❌ Missing modules:');
missing.forEach(req => console.log('  ', req));

if (missing.length > 0) {
  console.log('\n🚀 Creating placeholder files for missing modules...');
  missing.forEach(module => {
    const fileName = module.includes('.js') ? module : module + '.js';
    const content = `// ${fileName} - Placeholder\nconsole.log('✅ ${fileName} placeholder loaded');\nmodule.exports = {\n  init: () => console.log('${fileName} initialized'),\n  dummyMethod: () => Promise.resolve({ success: true })\n};`;
    
    fs.writeFileSync(fileName, content);
    console.log(`   Created: ${fileName}`);
  });
}

console.log(`\n📊 Summary: ${found.length} modules found, ${missing.length} modules created`);
