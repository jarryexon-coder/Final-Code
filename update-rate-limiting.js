const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Add rate limiting imports
if (!content.includes('const { promoLimiter, influencerLimiter }')) {
  const rateLimitImport = `\n// Rate Limiting\nconst { promoLimiter, influencerLimiter } = require('./middleware/rateLimit');\n`;
  content = content.replace(/\/\/ INFLUENCER ROUTES/g, rateLimitImport + '// INFLUENCER ROUTES');
}

// Apply rate limiting to promo routes
content = content.replace(
  'app.use(\'/api/promo\', promoRoutes);',
  'app.use(\'/api/promo\', promoLimiter, promoRoutes);'
);

// Apply rate limiting to influencer routes
content = content.replace(
  'app.use(\'/api/influencer\', influencerRoutes);',
  'app.use(\'/api/influencer\', influencerLimiter, influencerRoutes);'
);

fs.writeFileSync('server.js', content);
console.log('✅ Added rate limiting to promo and influencer endpoints');
