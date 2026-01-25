import express from 'express';
const router = express.Router();

// SIMPLE TEST ROUTES - no imports needed
router.get('/users', (req, res) => res.json({message: 'GET /users works'}));
router.get('/users/:id', (req, res) => res.json({message: 'GET /users/:id works', id: req.params.id}));
router.delete('/users/:id', (req, res) => res.json({message: 'DELETE /users/:id works', id: req.params.id}));

export default router;
