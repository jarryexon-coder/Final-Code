// test-kalshi.js - Test Kalshi API integration
import axios from 'axios';

const API_BASE = 'http://localhost:3002/api';

async function testKalshiEndpoints() {
  console.log('🧪 Testing Kalshi API endpoints...\n');
  
  const endpoints = [
    { method: 'GET', path: '/kalshi/health', auth: false },
    { method: 'GET', path: '/kalshi/markets?limit=3', auth: true },
    { method: 'GET', path: '/kalshi/categories', auth: false },
    { method: 'GET', path: '/kalshi/news?limit=2', auth: false },
    { method: 'GET', path: '/kalshi/stats', auth: false }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const url = `${API_BASE}${endpoint.path}`;
      console.log(`🔍 Testing: ${endpoint.method} ${url}`);
      
      const config = endpoint.auth ? {
        headers: {
          'kalshi-access-key': 'test-key-mock'
        }
      } : {};
      
      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(url, config);
      }
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response keys: ${Object.keys(response.data).join(', ')}`);
      
      if (response.data.success !== undefined) {
        console.log(`✓ Success: ${response.data.success}`);
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data: ${JSON.stringify(error.response.data)}`);
      }
      console.log('---\n');
    }
  }
  
  // Test predictions with Kalshi integration
  console.log('🤖 Testing Kalshi-integrated predictions...');
  try {
    const predictionResponse = await axios.post(`${API_BASE}/predictions/generate`, {
      prompt: "Will the Lakers beat the Warriors tonight?",
      sport: "NBA",
      includeKalshi: true
    });
    
    console.log(`✅ Prediction generated: ${predictionResponse.data.success}`);
    if (predictionResponse.data.prediction?.kalshiContext) {
      console.log(`✓ Kalshi context included: ${predictionResponse.data.prediction.kalshiContext.hasMarkets}`);
    }
  } catch (error) {
    console.error(`❌ Prediction error: ${error.message}`);
  }
}

// Run tests
testKalshiEndpoints().catch(console.error);
