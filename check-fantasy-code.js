import { readFileSync } from 'fs';

const content = readFileSync('./routes/fantasyRoutes.js', 'utf8');
const lines = content.split('\n');

console.log('🔍 Checking fantasyRoutes.js error handling...\n');

// Find the players route error handling
let inPlayersRoute = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('router.get(\'/players\'')) {
    inPlayersRoute = true;
    console.log('Found players route at line', i + 1);
  }
  
  if (inPlayersRoute && lines[i].includes('} catch (error) {')) {
    console.log('\nError handling in players route:');
    for (let j = i; j < Math.min(i + 10, lines.length); j++) {
      console.log(`  ${j + 1}: ${lines[j]}`);
      if (lines[j].includes('res.status(500).json')) {
        break;
      }
    }
    break;
  }
}

// Check if Player model import exists
console.log('\n📦 Checking imports...');
const importLines = lines.filter(line => line.includes('import'));
importLines.forEach(line => console.log(`  ${line}`));

// Check if Player model is imported
const hasPlayerImport = importLines.some(line => line.includes('Player'));
console.log(`\n✅ Player model imported: ${hasPlayerImport}`);
