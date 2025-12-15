import express from 'express';
const router = express.Router();

router.get('/trends', (req, res) => {
  res.json({ success: true, trends: [] });
});

export default router;
