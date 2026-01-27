// middleware/security.js
import helmet from 'helmet';
import cors from 'cors';

export const securityMiddleware = (app) => {
  // Basic security headers
  app.use(helmet());
  
  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:19006'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
};
