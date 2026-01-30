import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'NBA API (Safe)', status: 'ok' });
});

router.get('/games', (req, res) => {
  res.json({ games: [] });
});

export default router;
