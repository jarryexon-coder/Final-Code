// Test to check if auth.js can be loaded
try {
  const auth = require('./routes/auth');
  console.log('✅ auth.js loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth.js:', error.message);
  console.error('Stack:', error.stack);
}
