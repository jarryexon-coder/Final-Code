const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// The issue is the extra } after the influencer routes try-catch
// Let's find and fix the specific section
const lines = content.split('\n');
let newLines = [];
let foundProblem = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Look for the problematic section
  if (line.includes('} catch (error) {') && 
      lines[i-1] && lines[i-1].includes('console.log(\'✅ Influencer routes loaded\')')) {
    console.log('Found the problematic catch block at line', i);
    // Skip this line and the next 2 lines (the whole catch block)
    foundProblem = true;
    continue; // Skip the '} catch (error) {' line
  }
  
  if (foundProblem && line.includes('console.error(\'❌ Failed to load influencer routes:\'')) {
    // Skip the console.error line
    continue;
  }
  
  if (foundProblem && line.trim() === '}') {
    // Skip the closing brace
    foundProblem = false;
    continue;
  }
  
  newLines.push(line);
}

// Also need to fix the } at the end that's closing nothing
const finalContent = newLines.join('\n');

// Remove the stray } that comes after "MONITORING ROUTES"
const cleanedContent = finalContent.replace(
  `// =============================================================================
// MONITORING ROUTES
// =============================================================================
}`,
  `// =============================================================================
// MONITORING ROUTES
// =============================================================================`
);

fs.writeFileSync('server.js', cleanedContent);
console.log('✅ Fixed syntax error in server.js');
