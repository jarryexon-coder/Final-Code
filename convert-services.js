import { readFileSync, writeFileSync } from 'fs';

const services = [
  'services/ai-prediction-service.js',
  'services/analytics-service.js',
  'services/bettingAlgorithms.js',
  'services/emailService.js',
  'services/enhancedNBAService.js',
  'services/nba-data-service.js',
  'services/nbaApiService.js',
  'services/notificationService.js'
];

const patterns = [
  { regex: /const (\w+) = require\('([^']+)'\);/g, replace: "import $1 from '$2';" },
  { regex: /module\.exports = new (\w+)\(\);/g, replace: "export default new $1();" },
  { regex: /module\.exports = (\w+);/g, replace: "export default $1;" }
];

for (const service of services) {
  try {
    let content = readFileSync(service, 'utf8');
    
    for (const { regex, replace } of patterns) {
      content = content.replace(regex, replace);
    }
    
    // Fix relative imports
    content = content.replace(
      /from '\.\/([^']+)'/g,
      "from './$1.js'"
    );
    
    writeFileSync(service + '.backup', readFileSync(service, 'utf8'));
    writeFileSync(service, content);
    console.log(`✅ Converted ${service}`);
  } catch (error) {
    console.log(`⚠️  Skipped ${service}: ${error.message}`);
  }
}
