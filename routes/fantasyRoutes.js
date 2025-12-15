import express from 'express';
const router = express.Router();

router.get('/lineup', (req, res) => {
  res.json({ success: true, lineup: [] });
});

export default router;
