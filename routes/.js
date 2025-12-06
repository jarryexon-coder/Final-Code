// routes/.js - Placeholder
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: ' routes - placeholder' });
});

module.exports = router;
