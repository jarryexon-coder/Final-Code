import express from 'express';

const app = express();

// Create a mock request/response
const mockReq = {
  method: 'GET',
  url: '/api/fantasy',
  originalUrl: '/api/fantasy',
  path: '/api/fantasy',
  query: {},
  params: {},
  headers: {}
};

const mockRes = {
  json: function(data) {
    console.log('✅ Response from fantasy router:', data);
    return this;
  },
  status: function(code) {
    console.log(`Status code: ${code}`);
    return this;
  }
};

const mockNext = () => console.log('Next called');

async function test() {
  try {
    const fantasyModule = await import('./routes/fantasyRoutes.js');
    const fantasyRouter = fantasyModule.default;
    
    console.log('Testing fantasy router directly...');
    
    // Manually call the router
    fantasyRouter.handle(mockReq, mockRes, mockNext);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

test();
