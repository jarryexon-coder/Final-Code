// config/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NBA Fantasy AI API',
      version: '5.0.0',
      description: 'Complete NBA Fantasy AI Backend API Documentation',
      contact: {
        name: 'NBA Fantasy AI Team',
        url: 'https://februaryfantasy-production.up.railway.app',
        email: 'support@nbafantasy.ai'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://pleasing-determination-production.up.railway.app',
        description: 'Production Server'
      },
      {
        url: 'http://localhost:3002',
        description: 'Local Development'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        Game: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 401585601 },
            date: { type: 'string', format: 'date-time', example: '2024-01-30T00:30:00Z' },
            home_team: { type: 'string', example: 'LAL' },
            away_team: { type: 'string', example: 'BOS' },
            home_score: { type: 'integer', example: 112 },
            away_score: { type: 'integer', example: 108 },
            status: { type: 'string', example: 'Final', enum: ['Scheduled', 'InProgress', 'Final'] }
          }
        },
        Player: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 237 },
            first_name: { type: 'string', example: 'LeBron' },
            last_name: { type: 'string', example: 'James' },
            position: { type: 'string', example: 'F' },
            team: { type: 'string', example: 'LAL' },
            height: { type: 'string', example: '6-9' },
            weight: { type: 'string', example: '250' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Resource not found' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid'
        },
        NotFoundError: {
          description: 'The specified resource was not found'
        },
        ValidationError: {
          description: 'Validation error in request parameters'
        }
      }
    },
    tags: [
      { name: 'NBA', description: 'NBA game and player data' },
      { name: 'Fantasy', description: 'Fantasy basketball operations' },
      { name: 'Predictions', description: 'AI predictions and analytics' },
      { name: 'Betting', description: 'Betting odds and analysis' },
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Health', description: 'Health check endpoints' }
    ]
  },
  apis: [
    './routes/*.js',
    './server.js'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
  // Swagger UI will be mounted by the main server
};
