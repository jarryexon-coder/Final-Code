const fs = require('fs');
let lines = fs.readFileSync('server.js', 'utf8').split('\n');

let foundExpress = false;
let foundOtherDupes = {};
let newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check for duplicate express declaration
  if (line.includes('const express = require(\'express\')')) {
    if (!foundExpress) {
      newLines.push(line);
      foundExpress = true;
    } else {
      console.log(`Skipping duplicate express at line ${i + 1}`);
      // Skip this line (it's a duplicate)
    }
  }
  // Check for other duplicate const declarations
  else if (line.trim().startsWith('const ')) {
    const match = line.match(/const (\w+)/);
    if (match) {
      const varName = match[1];
      if (foundOtherDupes[varName]) {
        console.log(`Skipping duplicate declaration of ${varName} at line ${i + 1}`);
        // Skip this line
      } else {
        newLines.push(line);
        foundOtherDupes[varName] = true;
      }
    } else {
      newLines.push(line);
    }
  } else {
    newLines.push(line);
  }
}

fs.writeFileSync('server.js', newLines.join('\n'));
console.log('✅ Removed duplicate declarations');
console.log(`Original: ${lines.length} lines`);
console.log(`New: ${newLines.length} lines`);
