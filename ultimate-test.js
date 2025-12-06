console.log('🏁 ULTIMATE COMPREHENSIVE TEST\n');

// Test 1: Check critical modules
console.log('1. Testing critical modules...');
const criticalModules = [
  'express', 'mongoose', 'cors', 'dotenv', 'body-parser',
  './routes/auth', './routes/favorites', './routes/nba'
];

criticalModules.forEach(mod => {
  try {
    require.resolve(mod);
    console.log(`   ✅ ${mod}`);
  } catch (e) {
    console.log(`   ❌ ${mod} - ${e.message}`);
  }
});

// Test 2: Check custom services
console.log('\n2. Testing custom services...');
const services = [
  './analytics-service',
  './notification-service',
  './social-db', 
  './multi-source-service',
  './nba-data-service',
  './enhanced-personalization',
  './ai-prediction-service',
  './firebase-config',
  './sports-scheduler-service',
  './websocket-service'
];

services.forEach(service => {
  try {
    require(service);
    console.log(`   ✅ ${service}`);
  } catch (e) {
    console.log(`   ❌ ${service} - ${e.message}`);
  }
});

// Test 3: Check webhooks
console.log('\n3. Testing webhooks...');
const webhooks = [
  './webhooks/phase1-core-foundation',
  './webhooks/phase2-statistical-core', 
  './webhooks/phase3-betting-predictions',
  './webhooks/phase6-fantasy-sports'
];

webhooks.forEach(webhook => {
  try {
    require(webhook);
    console.log(`   ✅ ${webhook}`);
  } catch (e) {
    console.log(`   ❌ ${webhook} - ${e.message}`);
  }
});

// Test 4: Check config
console.log('\n4. Testing config...');
try {
  require('./config/firebase-admin');
  console.log('   ✅ ./config/firebase-admin');
} catch (e) {
  console.log(`   ❌ ./config/firebase-admin - ${e.message}`);
}

console.log('\n🎯 Test completed. If all checks pass, your server should start!');
