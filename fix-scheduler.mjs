import { readFileSync, writeFileSync } from 'fs';

const filePath = 'services/sports-scheduler.js';
let content = readFileSync(filePath, 'utf8');

console.log('Checking sports-scheduler.js line 213:');
const lines = content.split('\n');
console.log('Line 213:', lines[212]);

// Fix the "this" binding issue
content = content.replace(
  'this.balldontlieInterval = setInterval(this.balldontlieRequestHandler.bind(this), 1000);',
  '// Fixed: Store this context\n        const self = this;\n        this.balldontlieInterval = setInterval(() => self.balldontlieRequestHandler(), 1000);'
);

writeFileSync(filePath, content);
console.log('✅ Fixed sports-scheduler.js');
