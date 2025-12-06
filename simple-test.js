const fs = require('fs');
const path = require('path');

console.log('🧪 SIMPLE FILE EXISTENCE TEST\n');

const filesToCheck = [
  'ai-prediction-service.js',
  'firebase-config.js',
  'webhooks/phase1-core-foundation.js',
  'webhooks/phase2-statistical-core.js', 
  'webhooks/phase3-betting-predictions.js',
  'webhooks/phase6-fantasy-sports.js',
  'config/firebase-admin.js'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} EXISTS`);
    
    // Try to require it
    try {
      require('./' + file.replace('.js', ''));
      console.log(`   📦 ${file} can be required`);
    } catch (e) {
      console.log(`   ❌ ${file} require failed: ${e.message}`);
    }
  } else {
    console.log(`❌ ${file} MISSING`);
  }
});
