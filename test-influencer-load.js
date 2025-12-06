const express = require('express');
const app = express();

console.log('Testing influencer route loading...');

try {
  console.log('Attempting to require influencer routes...');
  const influencerRoutes = require('./routes/influencer');
  console.log('✅ Influencer routes required successfully');
  
  // Mount the routes
  app.use('/api/influencer', influencerRoutes);
  
  // Test the routes
  const request = require('supertest');
  
  async function testRoute() {
    console.log('Testing /api/influencer/health...');
    const response = await request(app).get('/api/influencer/health');
    console.log('Response status:', response.status);
    console.log('Response body:', response.body);
  }
  
  testRoute().catch(console.error);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
