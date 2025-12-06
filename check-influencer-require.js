try {
  const influencerRoutes = require('./routes/influencer');
  console.log('✅ Influencer routes loaded successfully');
  console.log('Routes exported:', Object.keys(influencerRoutes));
} catch (error) {
  console.error('❌ Error requiring influencer routes:', error.message);
  console.error('Full error:', error);
}
