import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=========================================');
console.log('  BACKEND DIAGNOSTIC REPORT             ');
console.log('=========================================');

// 1. Check package.json
console.log('\n1. PACKAGE.JSON:');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log(`  Name: ${pkg.name}`);
  console.log(`  Version: ${pkg.version}`);
  console.log(`  Type: ${pkg.type || 'CommonJS (default)'}`);
  console.log(`  Main: ${pkg.main || 'index.js'}`);
} else {
  console.log('  ❌ package.json not found');
}

// 2. Check server.js
console.log('\n2. SERVER.JS:');
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  const lines = serverContent.split('\n').length;
  console.log(`  Lines: ${lines}`);
  console.log(`  Contains "import": ${serverContent.includes('import ')}`);
  console.log(`  Contains "require": ${serverContent.includes('require(')}`);
  console.log(`  Contains "mongoose": ${serverContent.includes('mongoose')}`);
  console.log(`  Contains "express": ${serverContent.includes('express')}`);
} else {
  console.log('  ❌ server.js not found');
}

// 3. Check models directory
console.log('\n3. MODELS DIRECTORY:');
const modelsDir = path.join(__dirname, 'models');
if (fs.existsSync(modelsDir)) {
  const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));
  console.log(`  Number of model files: ${modelFiles.length}`);
  console.log(`  Files: ${modelFiles.join(', ')}`);
  
  // Check models/index.js
  const modelsIndex = path.join(modelsDir, 'index.js');
  if (fs.existsSync(modelsIndex)) {
    const indexContent = fs.readFileSync(modelsIndex, 'utf8');
    console.log(`  models/index.js exists: ✓`);
    console.log(`  Exports models: ${indexContent.includes('export')}`);
  } else {
    console.log('  models/index.js: ❌ NOT FOUND');
  }
} else {
  console.log('  ❌ models directory not found');
}

// 4. Check routes directory
console.log('\n4. ROUTES DIRECTORY:');
const routesDir = path.join(__dirname, 'routes');
if (fs.existsSync(routesDir)) {
  const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  console.log(`  Number of route files: ${routeFiles.length}`);
  console.log(`  Files: ${routeFiles.join(', ')}`);
} else {
  console.log('  ❌ routes directory not found');
}

// 5. Check environment
console.log('\n5. ENVIRONMENT:');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasMongoDB = envContent.includes('MONGODB_URI');
  const hasPort = envContent.includes('PORT');
  console.log(`  .env exists: ✓`);
  console.log(`  Has MONGODB_URI: ${hasMongoDB ? '✓' : '❌'}`);
  console.log(`  Has PORT: ${hasPort ? '✓' : '❌'}`);
  
  // Show first few lines (masked)
  const lines = envContent.split('\n').slice(0, 5);
  console.log(`  Sample: ${lines.map(l => l.replace(/=.*/, '=***')).join(' | ')}`);
} else {
  console.log('  ❌ .env file not found');
}

// 6. Check node_modules
console.log('\n6. DEPENDENCIES:');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log(`  node_modules exists: ✓`);
  
  // Check key dependencies
  const keyDeps = ['mongoose', 'express', 'cors', 'dotenv'];
  for (const dep of keyDeps) {
    const depPath = path.join(nodeModulesPath, dep);
    console.log(`  ${dep}: ${fs.existsSync(depPath) ? '✓' : '❌'}`);
  }
} else {
  console.log('  ❌ node_modules not found - run npm install');
}

console.log('\n=========================================');
console.log('  DIAGNOSTIC COMPLETE                   ');
console.log('=========================================');
