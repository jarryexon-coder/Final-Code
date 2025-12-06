const fs = require('fs');
const content = fs.readFileSync('server.js', 'utf8');

// Replace the broken section
const fixedContent = content.replace(
  `// =============================================================================
// PROMO ROUTES (using enhanced version)
// =============================================================================

try {
  const promoRoutes = require('./routes/promo/enhanced');
  app.use('/api/promo', promoRoutes);
  console.log('✅ Promo routes loaded (enhanced version)');
} catch (error) {
  console.error('❌ Failed to load promo routes:', error.message);

// Load influencer routes
const influencerRoutes = require('./routes/influencer');
app.use('/api/influencer', influencerRoutes);
console.log('✅ Influencer routes loaded');
  // Create a basic promo router as fallback
  const promoRouter = express.Router();
  promoRouter.get('/public', (req, res) => {
    res.json({ success: true, message: 'Promo system is being enhanced' });
  });
  app.use('/api/promo', promoRouter);
}

// =============================================================================
// INFLUENCER ROUTES
// =============================================================================
} catch (error) {
  console.error('❌ Failed to load influencer routes:', error.message);
}`,
  `// =============================================================================
// PROMO ROUTES (using enhanced version)
// =============================================================================

try {
  const promoRoutes = require('./routes/promo/enhanced');
  app.use('/api/promo', promoRoutes);
  console.log('✅ Promo routes loaded (enhanced version)');
} catch (error) {
  console.error('❌ Failed to load promo routes:', error.message);
  
  // Create a basic promo router as fallback
  const promoRouter = express.Router();
  promoRouter.get('/public', (req, res) => {
    res.json({ success: true, message: 'Promo system is being enhanced' });
  });
  app.use('/api/promo', promoRouter);
}

// =============================================================================
// INFLUENCER ROUTES - MUST BE OUTSIDE THE CATCH BLOCK!
// =============================================================================

const influencerRoutes = require('./routes/influencer');
app.use('/api/influencer', influencerRoutes);
console.log('✅ Influencer routes loaded');`
);

fs.writeFileSync('server.js', fixedContent);
console.log('✅ Fixed server.js - influencer routes now load properly');
