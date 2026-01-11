// docs/swagger.js - API Documentation
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'NBA Fantasy AI Backend API',
    version: '5.0.0',
    description: 'Complete sports analytics and secret phrase tracking system',
    contact: {
      name: 'API Support',
      email: 'support@yourdomain.com'
    }
  },
  servers: [
    {
      url: 'https://api.yourdomain.com',
      description: 'Production server'
    },
    {
      url: 'http://localhost:8080',
      description: 'Development server'
    }
  ],
  tags: [
    { name: 'Sports Analytics', description: 'Real-time sports data and arbitrage' },
    { name: 'Situational Analysis', description: 'Game-time insights and edges' },
    { name: 'Premium Features', description: 'Subscription-based advanced features' },
    { name: 'Secret Phrases', description: 'Analytics for secret phrase discovery' }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js', './server.js']
};

export default options;
