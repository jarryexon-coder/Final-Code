import SportsBettingAnalyticsService from './services/SportsBettingAnalyticsService.js';
import SituationalAnalysisService from './services/SituationalAnalysisService.js';
import PremiumFeaturesService from './services/PremiumFeaturesService.js';
import KalshiMarketService from './services/KalshiMarketService.js';
import DraftStrategyService from './services/DraftStrategyService.js';
import ContestOptimizer from './services/ContestOptimizer.js';

async function testAllServices() {
  console.log('🚀 Testing All Services...\n');
  
  const testResults = [];
  
  // Test 1: Sports Betting Analytics
  try {
    console.log('1. Testing Sports Betting Analytics Service...');
    const arbitrage = await SportsBettingAnalyticsService.findArbitrageOpportunities('NBA');
    console.log(`   ✅ Arbitrage: Found ${arbitrage.totalOpportunities} opportunities`);
    
    const sharpMoney = await SportsBettingAnalyticsService.trackSharpMoney('NFL');
    console.log(`   ✅ Sharp Money: ${sharpMoney.sharpMoves.length} moves tracked`);
    
    testResults.push({ service: 'SportsBettingAnalytics', status: 'PASS' });
  } catch (error) {
    console.log(`   ❌ Sports Betting Analytics: ${error.message}`);
    testResults.push({ service: 'SportsBettingAnalytics', status: 'FAIL' });
  }
  
  // Test 2: Situational Analysis
  try {
    console.log('\n2. Testing Situational Analysis Service...');
    const spotPlays = await SituationalAnalysisService.identifySpotPlays('NBA');
    console.log(`   ✅ Spot Plays: ${spotPlays.spotPlays.length} identified`);
    
    const weather = await SituationalAnalysisService.analyzeWeatherImpacts('NFL');
    console.log(`   ✅ Weather Analysis: ${weather.scenarios.length} scenarios`);
    
    testResults.push({ service: 'SituationalAnalysis', status: 'PASS' });
  } catch (error) {
    console.log(`   ❌ Situational Analysis: ${error.message}`);
    testResults.push({ service: 'SituationalAnalysis', status: 'FAIL' });
  }
  
  // Test 3: Premium Features
  try {
    console.log('\n3. Testing Premium Features Service...');
    const access = await PremiumFeaturesService.canAccessFeature('test123', 'snake_draft');
    console.log(`   ✅ Access Check: User can access? ${access.canAccess}`);
    
    const status = await PremiumFeaturesService.getUserPremiumStatus('test123');
    console.log(`   ✅ Premium Status: ${status.tier} tier`);
    
    testResults.push({ service: 'PremiumFeatures', status: 'PASS' });
  } catch (error) {
    console.log(`   ❌ Premium Features: ${error.message}`);
    testResults.push({ service: 'PremiumFeatures', status: 'FAIL' });
  }
  
  // Test 4: Kalshi Market Service
  try {
    console.log('\n4. Testing Kalshi Market Service...');
    const markets = await KalshiMarketService.getMarkets({ limit: 3 });
    console.log(`   ✅ Kalshi Markets: ${markets.length} markets fetched`);
    
    const arbitrage = KalshiMarketService.findArbitrageOpportunities(markets);
    console.log(`   ✅ Kalshi Arbitrage: ${arbitrage.length} opportunities`);
    
    testResults.push({ service: 'KalshiMarket', status: 'PASS' });
  } catch (error) {
    console.log(`   ❌ Kalshi Market: ${error.message}`);
    testResults.push({ service: 'KalshiMarket', status: 'FAIL' });
  }
  
  // Test 5: Draft Strategy Service
  try {
    console.log('\n5. Testing Draft Strategy Service...');
    const plan = DraftStrategyService.generateDraftPlan({
      draftPosition: 5,
      teamCount: 10,
      rounds: 10
    });
    console.log(`   ✅ Draft Plan: ${plan.plan.length} picks generated`);
    
    testResults.push({ service: 'DraftStrategy', status: 'PASS' });
  } catch (error) {
    console.log(`   ❌ Draft Strategy: ${error.message}`);
    testResults.push({ service: 'DraftStrategy', status: 'FAIL' });
  }
  
  // Test 6: Contest Optimizer
  try {
    console.log('\n6. Testing Contest Optimizer Service...');
    const mockPlayers = [
      { name: 'Test Player', position: 'QB', salary: 8500, projection: 22.5 }
    ];
    
    const result = await ContestOptimizer.generateOptimizedLineups({
      playerPool: mockPlayers,
      lineupCount: 1
    });
    console.log(`   ✅ Contest Optimizer: ${result.lineups.length} lineups generated`);
    
    testResults.push({ service: 'ContestOptimizer', status: 'PASS' });
  } catch (error) {
    console.log(`   ❌ Contest Optimizer: ${error.message}`);
    testResults.push({ service: 'ContestOptimizer', status: 'FAIL' });
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log('================');
  
  testResults.forEach(result => {
    console.log(`${result.status === 'PASS' ? '✅' : '❌'} ${result.service}`);
  });
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const total = testResults.length;
  
  console.log(`\n🎯 ${passed}/${total} services passed (${Math.round((passed/total)*100)}%)`);
  
  if (passed === total) {
    console.log('\n✨ ALL SERVICES OPERATIONAL! Your system is ready for all secret phrases.');
  } else {
    console.log('\n⚠️  Some services need attention. Check the logs above.');
  }
}

// Run all tests
testAllServices().catch(console.error);
