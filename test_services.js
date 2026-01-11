import KalshiMarketService from './services/KalshiMarketService.js';
import DraftStrategyService from './services/DraftStrategyService.js';
import ContestOptimizer from './services/ContestOptimizer.js';

async function testKalshiService() {
  console.log('🧪 Testing Kalshi Market Service...');
  
  try {
    // Test getting markets
    const markets = await KalshiMarketService.getMarkets({ limit: 5 });
    console.log(`✅ Got ${markets.length} markets`);
    
    // Test arbitrage detection
    const arbitrage = KalshiMarketService.findArbitrageOpportunities(markets);
    console.log(`✅ Found ${arbitrage.length} arbitrage opportunities`);
    
    // Test sentiment analysis
    const sentiment = KalshiMarketService.analyzeMarketSentiment(markets);
    console.log(`✅ Market sentiment: ${sentiment.overallSentiment}`);
    
    return true;
  } catch (error) {
    console.error('❌ Kalshi service test failed:', error);
    return false;
  }
}

function testDraftService() {
  console.log('🧪 Testing Draft Strategy Service...');
  
  try {
    const plan = DraftStrategyService.generateDraftPlan({
      draftPosition: 5,
      teamCount: 10,
      rounds: 10,
      strategy: 'balanced',
      scoringFormat: 'PPR'
    });
    
    console.log(`✅ Generated draft plan with ${plan.plan.length} picks`);
    console.log(`✅ Optimal strategy: ${plan.optimalStrategy.strategy}`);
    
    return true;
  } catch (error) {
    console.error('❌ Draft service test failed:', error);
    return false;
  }
}

async function testContestOptimizer() {
  console.log('🧪 Testing Contest Optimizer...');
  
  try {
    // Create mock player pool
    const mockPlayers = [
      { name: 'Player 1', position: 'QB', salary: 8500, projection: 22.5, ownership: 0.15 },
      { name: 'Player 2', position: 'RB', salary: 7500, projection: 18.2, ownership: 0.25 },
      { name: 'Player 3', position: 'WR', salary: 7000, projection: 16.8, ownership: 0.12 },
      { name: 'Player 4', position: 'TE', salary: 6000, projection: 14.3, ownership: 0.08 },
      { name: 'Player 5', position: 'DEF', salary: 3500, projection: 8.5, ownership: 0.10 }
    ];
    
    const result = await ContestOptimizer.generateOptimizedLineups({
      playerPool: mockPlayers,
      contestType: 'FanDuel NFL',
      lineupCount: 2,
      strategy: 'balanced'
    });
    
    console.log(`✅ Generated ${result.lineups.length} optimized lineups`);
    console.log(`✅ Average projection: ${result.summary.averageProjection}`);
    
    return true;
  } catch (error) {
    console.error('❌ Contest optimizer test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Running all service tests...\n');
  
  const results = await Promise.allSettled([
    testKalshiService(),
    testDraftService(),
    testContestOptimizer()
  ]);
  
  console.log('\n📊 Test Results:');
  results.forEach((result, index) => {
    const service = ['Kalshi', 'Draft', 'Contest'][index];
    if (result.status === 'fulfilled' && result.value) {
      console.log(`✅ ${service} Service: PASS`);
    } else {
      console.log(`❌ ${service} Service: FAIL`);
    }
  });
  
  const passed = results.filter(r => r.status === 'fulfilled' && r.value).length;
  console.log(`\n🎯 ${passed}/3 services passed`);
}

// Run tests
runAllTests().catch(console.error);
