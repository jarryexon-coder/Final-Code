const fs = require('fs');

const serverFile = './server.js';
let content = fs.readFileSync(serverFile, 'utf8');

// Remove the problematic service initialization block
const oldCode = `    // 3. Initialize services
    console.log('🔄 Initializing services...');
    await Promise.all([
      SportsBettingAnalyticsService.initialize(),
      SituationalAnalysisService.initialize(),
      PremiumFeaturesService.initialize(),
      DraftStrategyService.initialize(),
      ContestOptimizer.initialize(),
      KalshiMarketService.initialize()
    ]);
    console.log('✅ All services initialized');`;

const newCode = `    // 3. Start the HTTP server`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(serverFile, content);
console.log('✅ Server.js fixed - removed problematic service initialization');
