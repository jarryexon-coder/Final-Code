try {
  require('./server.js');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('❌ Missing module:', error.message);
    // Try to find all requires in server.js
    const fs = require('fs');
    const content = fs.readFileSync('./server.js', 'utf8');
    const requires = content.match(/require\(['"]([^'"]+)['"]\)/g) || [];
    console.log('\n📋 All require statements in server.js:');
    requires.forEach(req => console.log('  ', req));
  } else {
    console.error('Error:', error.message);
  }
}
