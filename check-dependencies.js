// Check if all required dependencies are installed
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const dependencies = packageJson.dependencies || {};

console.log('🔍 Checking installed dependencies...\n');

const requiredPackages = [
  'axios',
  'joi',
  'bcryptjs',
  'jsonwebtoken',
  'redis',
  'mongoose',
  'express',
  'cors',
  'dotenv',
  'socket.io'
];

let missingPackages = [];

// Try to import each package
for (const pkg of requiredPackages) {
  try {
    await import(pkg);
    console.log(`✅ ${pkg} is installed`);
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.log(`❌ ${pkg} is NOT installed`);
      missingPackages.push(pkg);
    } else {
      console.log(`⚠ ${pkg}: ${error.message}`);
    }
  }
}

console.log('\n📊 Summary:');
if (missingPackages.length === 0) {
  console.log('🎉 All required packages are installed!');
} else {
  console.log(`Missing ${missingPackages.length} packages: ${missingPackages.join(', ')}`);
  console.log('\nTo install missing packages:');
  console.log(`npm install ${missingPackages.join(' ')}`);
}
