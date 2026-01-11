const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose'); // Add mongoose for database operations

// Import the SecretPhraseAnalytics model
const SecretPhraseAnalytics = require('./models/SecretPhraseAnalytics');

// Mock function - replace with real odds API
async function updateBettingOdds() {
  console.log(`[${new Date().toISOString()}] Updating betting odds...`);

  try {
    // This is where you would call a real odds API
    // For now, just log
    console.log('Betting odds update simulated');

    // Example: Fetch from external API
    // const response = await axios.get('https://api.odds.com/v1/nba/odds');
    // Process and save to database...

    return true;
  } catch (error) {
    console.error('Error updating odds:', error);
    return false;
  }
}

// Fantasy Updates
async function updateFantasyRecommendations() {
  console.log(`[${new Date().toISOString()}] Updating fantasy recommendations...`);
  
  for (const sport of ['NBA', 'NFL', 'NHL']) {
    try {
      const recommendations = await generateFantasyRecommendations(sport);
      
      // Update cache (assuming cache module is available)
      if (cache) {
        await cache.set(`fantasy-${sport}`, recommendations, 900);
      }
      
      // Send WebSocket update (assuming io is available)
      if (io) {
        io.emit('fantasy-update', {
          sport,
          recommendations,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ ${sport} fantasy recommendations updated`);
    } catch (error) {
      console.error(`❌ Error updating ${sport} fantasy:`, error);
    }
  }
}

async function updateInjuryReports() {
  console.log(`[${new Date().toISOString()}] Updating injury reports...`);
  
  try {
    // This would fetch from injury API
    // For now, simulate update
    console.log('Injury reports update simulated');
    
    // Example: Fetch injuries
    // const injuries = await axios.get('https://api.sportsdata.io/v3/nba/injuries');
    // Process and notify...
    
    return true;
  } catch (error) {
    console.error('Error updating injury reports:', error);
    return false;
  }
}

async function updateLiveScores() {
  console.log(`[${new Date().toISOString()}] Updating live scores...`);
  
  try {
    // This would fetch live scores
    // For now, simulate update
    console.log('Live scores update simulated');
    
    // Example: Fetch live games
    // const liveGames = await axios.get('https://api.sportsdata.io/v3/nba/scores/json/GamesByDate/2025-12-06');
    // Update database and push notifications...
    
    return true;
  } catch (error) {
    console.error('Error updating live scores:', error);
    return false;
  }
}

// =============================================
// SECRET PHRASE ANALYTICS PROCESSING
// =============================================

async function calculatePhrasePerformance(startDate, endDate) {
  try {
    console.log(`📊 Calculating phrase performance from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const performance = await SecretPhraseAnalytics.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          outcome: { $in: ['win', 'loss', 'push'] }
        }
      },
      {
        $group: {
          _id: '$phraseCategory',
          totalBets: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$outcome', 'win'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$outcome', 'loss'] }, 1, 0] } },
          pushes: { $sum: { $cond: [{ $eq: ['$outcome', 'push'] }, 1, 0] } },
          totalUnitsWon: { $sum: '$unitsWon' },
          avgConfidence: { $avg: '$confidence' },
          uniqueUsers: { $addToSet: '$userId' },
          uniquePhrases: { $addToSet: '$phraseKey' }
        }
      },
      {
        $project: {
          category: '$_id',
          totalBets: 1,
          wins: 1,
          losses: 1,
          pushes: 1,
          totalUnitsWon: 1,
          avgConfidence: 1,
          winRate: { 
            $cond: [
              { $gt: ['$totalBets', 0] },
              { $multiply: [{ $divide: ['$wins', '$totalBets'] }, 100] },
              0
            ]
          },
          uniqueUserCount: { $size: '$uniqueUsers' },
          uniquePhraseCount: { $size: '$uniquePhrases' }
        }
      },
      { $sort: { totalUnitsWon: -1 } }
    ]);

    console.log(`✅ Phrase performance calculated: ${performance.length} categories analyzed`);
    return performance;
  } catch (error) {
    console.error('❌ Error calculating phrase performance:', error);
    return [];
  }
}

async function calculateDiscoveryRates(startDate, endDate) {
  try {
    console.log(`🔍 Calculating discovery rates from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const discoveries = await SecretPhraseAnalytics.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          eventType: 'discovery'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          totalDiscoveries: { $sum: 1 },
          byRarity: {
            $push: {
              rarity: '$rarity',
              phraseKey: '$phraseKey',
              userId: '$userId'
            }
          }
        }
      },
      {
        $project: {
          date: '$_id',
          totalDiscoveries: 1,
          commonCount: {
            $size: {
              $filter: {
                input: '$byRarity',
                as: 'item',
                cond: { $eq: ['$$item.rarity', 'common'] }
              }
            }
          },
          uncommonCount: {
            $size: {
              $filter: {
                input: '$byRarity',
                as: 'item',
                cond: { $eq: ['$$item.rarity', 'uncommon'] }
              }
            }
          },
          rareCount: {
            $size: {
              $filter: {
                input: '$byRarity',
                as: 'item',
                cond: { $eq: ['$$item.rarity', 'rare'] }
              }
            }
          },
          legendaryCount: {
            $size: {
              $filter: {
                input: '$byRarity',
                as: 'item',
                cond: { $eq: ['$$item.rarity', 'legendary'] }
              }
            }
          },
          uniqueUsers: {
            $size: {
              $reduce: {
                input: '$byRarity',
                initialValue: [],
                in: { $setUnion: ['$$value', ['$$this.userId']] }
              }
            }
          },
          uniquePhrases: {
            $size: {
              $reduce: {
                input: '$byRarity',
                initialValue: [],
                in: { $setUnion: ['$$value', ['$$this.phraseKey']] }
              }
            }
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Calculate summary stats
    const summary = discoveries.reduce((acc, day) => {
      acc.totalDiscoveries += day.totalDiscoveries;
      acc.totalCommon += day.commonCount;
      acc.totalUncommon += day.uncommonCount;
      acc.totalRare += day.rareCount;
      acc.totalLegendary += day.legendaryCount;
      return acc;
    }, {
      totalDiscoveries: 0,
      totalCommon: 0,
      totalUncommon: 0,
      totalRare: 0,
      totalLegendary: 0,
      averagePerDay: 0
    });

    if (discoveries.length > 0) {
      summary.averagePerDay = summary.totalDiscoveries / discoveries.length;
    }

    console.log(`✅ Discovery rates calculated: ${summary.totalDiscoveries} total discoveries`);
    return {
      dailyBreakdown: discoveries,
      summary
    };
  } catch (error) {
    console.error('❌ Error calculating discovery rates:', error);
    return { dailyBreakdown: [], summary: {} };
  }
}

async function processDailyAnalytics() {
  try {
    console.log(`[${new Date().toISOString()}] 🚀 Starting daily analytics processing...`);
    
    // Calculate for yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfDay = new Date(yesterday);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(yesterday);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`📅 Processing data for: ${startOfDay.toISOString().split('T')[0]}`);

    // Calculate analytics
    const phraseAnalytics = await calculatePhrasePerformance(startOfDay, endOfDay);
    const discoveryMetrics = await calculateDiscoveryRates(startOfDay, endOfDay);

    // Create comprehensive daily report
    const dailyReport = {
      date: startOfDay.toISOString().split('T')[0],
      processedAt: new Date(),
      secretPhrases: {
        performance: phraseAnalytics,
        discoveries: discoveryMetrics,
        summary: {
          totalPhraseEvents: phraseAnalytics.reduce((sum, cat) => sum + cat.totalBets, 0),
          totalDiscoveries: discoveryMetrics.summary.totalDiscoveries,
          totalUnitsWon: phraseAnalytics.reduce((sum, cat) => sum + cat.totalUnitsWon, 0),
          categoriesAnalyzed: phraseAnalytics.length,
          discoveryRarityDistribution: {
            common: discoveryMetrics.summary.totalCommon,
            uncommon: discoveryMetrics.summary.totalUncommon,
            rare: discoveryMetrics.summary.totalRare,
            legendary: discoveryMetrics.summary.totalLegendary
          }
        }
      }
    };

    // Store the report in database (you can create a collection for this)
    // await storeDailyAnalyticsReport(dailyReport);
    
    // Send WebSocket update if available
    if (global.wss) {
      const eventData = {
        type: 'daily_analytics_report',
        data: dailyReport,
        timestamp: new Date()
      };
      
      global.wss.clients.forEach(client => {
        if (client.readyState === 1) { // 1 = OPEN
          client.send(JSON.stringify(eventData));
        }
      });
      console.log('📡 WebSocket update sent to connected clients');
    }

    console.log('✅ Daily analytics processing complete');
    console.log(`   • Total phrase events: ${dailyReport.secretPhrases.summary.totalPhraseEvents}`);
    console.log(`   • Total discoveries: ${dailyReport.secretPhrases.summary.totalDiscoveries}`);
    console.log(`   • Total units won: ${dailyReport.secretPhrases.summary.totalUnitsWon}`);

    return dailyReport;

  } catch (error) {
    console.error('❌ Error in daily analytics processing:', error);
    throw error;
  }
}

// Helper function for storing the report (optional)
async function storeDailyAnalyticsReport(report) {
  try {
    // You can create a separate collection for daily reports
    // const db = mongoose.connection.db;
    // await db.collection('daily_analytics_reports').insertOne(report);
    // console.log('📁 Daily report stored in database');
  } catch (error) {
    console.error('❌ Error storing daily report:', error);
  }
}

// Helper function - you'll need to implement this
async function generateFantasyRecommendations(sport) {
  console.log(`Generating ${sport} fantasy recommendations...`);
  
  // This is where you would:
  // 1. Fetch player stats
  // 2. Analyze matchups
  // 3. Apply your AI/ML models
  // 4. Return structured recommendations
  
  // For now, return mock data structure
  return {
    must_starts: [
      {
        player: 'LeBron James',
        team: 'LAL',
        position: 'SF/PF',
        projection: Math.floor(Math.random() * 10) + 55, // Randomize for demo
        value: 'Elite',
        injury: 'Probable',
        matchup: 'vs GSW',
        reasoning: 'High usage with AD questionable, Warriors rank 28th vs SF'
      }
    ],
    sleepers: [],
    avoids: [],
    updated_at: new Date().toISOString()
  };
}

// =============================================
// SCHEDULE ALL CRON JOBS
// =============================================

// Betting odds - every 5 minutes
cron.schedule('*/5 * * * *', updateBettingOdds);

// Fantasy recommendations - every 15 minutes
cron.schedule('*/15 * * * *', updateFantasyRecommendations);

// Injury reports - every hour
cron.schedule('0 * * * *', updateInjuryReports);

// Live scores - every 5 minutes
cron.schedule('*/5 * * * *', updateLiveScores);

// Secret Phrase Analytics - daily at 3 AM
cron.schedule('0 3 * * *', async () => {
  console.log('⏰ Daily analytics job triggered by cron...');
  try {
    await processDailyAnalytics();
  } catch (error) {
    console.error('❌ Cron job failed for analytics:', error);
  }
});

// Also run once on server start (except analytics - that's daily only)
updateBettingOdds();
updateFantasyRecommendations();
updateInjuryReports();
updateLiveScores();

console.log('✅ All cron jobs scheduled:');
console.log('   • Betting odds: every 5 minutes');
console.log('   • Fantasy recommendations: every 15 minutes');
console.log('   • Injury reports: every hour');
console.log('   • Live scores: every 5 minutes');
console.log('   • Secret Phrase Analytics: daily at 3 AM');

module.exports = { 
  updateBettingOdds,
  updateFantasyRecommendations,
  updateInjuryReports,
  updateLiveScores,
  generateFantasyRecommendations,
  // Export the new analytics functions
  processDailyAnalytics,
  calculatePhrasePerformance,
  calculateDiscoveryRates
};
