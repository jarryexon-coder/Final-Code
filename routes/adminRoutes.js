// routes/adminRoutes.js - UPDATED
import express from 'express';
const router = express.Router();

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    service: 'Admin API',
    description: 'Administration and user management API',
    endpoints: [
      '/health',
      '/users',
      '/users/:id'
    ],
    timestamp: new Date().toISOString()
  });
});

// Health endpoint (YOUR FRONTEND IS CALLING THIS)
router.get('/health', (req, res) => {
  console.log('✅ Admin health check called');
  res.json({
    status: 'healthy',
    service: 'admin',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: ['/users', '/users/:id', '/health']
  });
});

// Other endpoints
router.get('/users', (req, res) => res.json({message: 'GET /users works'}));
router.get('/users/:id', (req, res) => res.json({message: 'GET /users/:id works', id: req.params.id}));
router.delete('/users/:id', (req, res) => res.json({message: 'DELETE /users/:id works', id: req.params.id}));

export default router;
