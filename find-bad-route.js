// find-bad-route.js
async function testAllRoutes() {
  const allRoutes = [
    'adminRoutes.js', 'analytics.js', 'predictions.js', 'fantasyRoutes.js',
    'players.js', 'teams.js', 'games.js', 'picks.js', 'secret-phrases.js',
    'betting.js', 'news.js', 'nhlRoutes.js', 'nflRoutes.js', 'kalshiRoutes.js',
    'draftRoutes.js', 'contestRoutes.js', 'sportsAnalyticsRoutes.js',
    'situationalRoutes.js', 'stubRoutes.js', 'statsRoutes.js', 'leaguesRoutes.js',
    'searchRoutes.js', 'cacheRoutes.js', 'prizepicksLimitsRoutes.js',
    'combinationsRoutes.js', 'notificationsRoutes.js', 'simulationsRoutes.js',
    'socialRoutes.js', 'fantasyTeamsRoutes.js', 'linesRoutes.js',
    'monitoringRoutes.js', 'selectionsRoutes.js', 'influencerRoutes.js',
    'bumpRiskRoutes.js', 'fantasyDraftRoutes.js', 'fantasyLineupRoutes.js',
    'fantasyOptimizationRoutes.js'
  ];
  
  console.log('Testing all 35 additional routes...\n');
  
  for (const routeFile of allRoutes) {
    try {
      console.log(`Testing: ${routeFile}`);
      await import(`./routes/${routeFile}`);
      console.log(`✅ ${routeFile} - OK\n`);
    } catch (error) {
      console.log(`❌❌❌ FOUND BAD ROUTE: ${routeFile}`);
      console.log(`Error: ${error.message}`);
      console.log(`Stack: ${error.stack}\n`);
      break; // Stop at first error
    }
  }
}

testAllRoutes();
