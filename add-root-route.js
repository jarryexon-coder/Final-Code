import { readFileSync, writeFileSync } from 'fs';

const filePath = './routes/fantasyRoutes.js';
let content = readFileSync(filePath, 'utf8');

// Check if root route exists
if (!content.includes("router.get('/',")) {
  console.log('Adding root route to fantasyRoutes.js...');
  
  // Find where to insert (after router declaration)
  const lines = content.split('\n');
  let insertIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const router = express.Router();')) {
      insertIndex = i + 1;
      break;
    }
  }
  
  if (insertIndex > 0) {
    // Insert root route
    lines.splice(insertIndex, 0, '');
    lines.splice(insertIndex + 1, 0, '// Root route');
    lines.splice(insertIndex + 2, 0, "router.get('/', (req, res) => {");
    lines.splice(insertIndex + 3, 0, "  res.json({");
    lines.splice(insertIndex + 4, 0, "    success: true,");
    lines.splice(insertIndex + 5, 0, "    message: 'Fantasy API is working',");
    lines.splice(insertIndex + 6, 0, "    endpoints: ['/players', '/players/:playerId', '/ai-advice'],");
    lines.splice(insertIndex + 7, 0, "    timestamp: new Date().toISOString()");
    lines.splice(insertIndex + 8, 0, "  });");
    lines.splice(insertIndex + 9, 0, "});");
    lines.splice(insertIndex + 10, 0, '');
    
    writeFileSync(filePath, lines.join('\n'));
    console.log('✅ Added root route to fantasyRoutes.js');
  } else {
    console.log('❌ Could not find router declaration');
  }
} else {
  console.log('✅ Root route already exists');
}
