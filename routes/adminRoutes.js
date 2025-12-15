import express from 'express';
const router = express.Router();

router.get('/stats', (req, res) => {
  res.json({ success: true, users: 0, games: 0 });
});

export default router;
