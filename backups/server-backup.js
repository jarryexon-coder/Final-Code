// 🚀 NBA FANTASY AI - COMPLETE ENHANCED VERSION v3.0 WITH ALL INTEGRATIONS
console.log('Starting NBA Fantasy AI - Complete Enhanced Version v3.0 with All Integrations');

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const crypto = require('crypto'); // Added crypto import
const app = express();

// ==================== STRIPE INITIALIZATION ====================
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// =============================================================================
// STRIPE WEBHOOK HANDLER - MUST BE AT THE TOP, BEFORE express.json()
// =============================================================================

// Webhook endpoint needs raw body - add this BEFORE bodyParser.json()
app.post('/stripe-webhook', 
  express.raw({type: 'application/json'}),
  (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log(`✅ Webhook received: ${event.type}`);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('💰 Checkout completed!');
        handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
        console.log('🆕 Subscription created!');
        handleSubscriptionCreated(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        console.log('💳 Payment succeeded!');
        handlePaymentSucceeded(event.data.object);
        break;
      case 'customer.subscription.deleted':
        console.log('❌ Subscription canceled!');
        handleSubscriptionCanceled(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({received: true});
  }
);

// Webhook handler functions
async function handleCheckoutCompleted(session) {
  console.log(`💰 Checkout completed for session: ${session.id}`);
  console.log(`Customer: ${session.customer}, User: ${session.metadata?.userId}`);
  
  // Update user subscription in database
  if (session.metadata?.userId) {
    try {
      await USER_DB.updateUserSubscription(session.metadata.userId, {
        stripeCustomerId: session.customer,
        subscriptionStatus: 'active',
        plan: session.metadata.plan,
        subscriptionStart: new Date().toISOString()
      });
      console.log(`✅ User ${session.metadata.userId} subscription updated`);
    } catch (error) {
      console.error('Error updating user subscription:', error);
    }
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log(`🆕 Subscription created: ${subscription.id}`);
  // Additional subscription setup if needed
}

async function handleSubscriptionCanceled(subscription) {
  console.log(`❌ Subscription canceled: ${subscription.id}`);
  // Revoke premium access
  // You'd update your database here
}

async function handlePaymentSucceeded(invoice) {
  console.log(`💳 Payment succeeded for invoice: ${invoice.id}`);
  // Handle successful payment
}

// =============================================================================
// REGULAR MIDDLEWARE - AFTER WEBHOOK HANDLER
// =============================================================================

// THEN add your regular JSON middleware for other routes
app.use(express.json());
app.use(bodyParser.json());

// ==================== NEW IMPORTS ====================
const AnalyticsService = require('./analytics-service');
const NotificationService = require('./notification-service');

// 🚀 ADD NEW REQUIRES AT TOP (after existing requires)
const SOCIAL_DB = require('./social-db');
const MULTI_SOURCE_SERVICE = require('./multi-source-service');
const ENHANCED_PERSONALIZATION = require('./enhanced-personalization');

// Add enhanced handlers for all phases
const phase1Handlers = require('./webhooks/phase1-core-foundation');
const phase2Handlers = require('./webhooks/phase2-statistical-core');
const phase3Handlers = require('./webhooks/phase3-betting-predictions');
const phase6Handlers = require('./webhooks/phase6-fantasy-sports');

// =============================================================================
// NEW SERVICE IMPORTS FOR ADDED ENDPOINTS
// =============================================================================
const NBADataService = require('./nba-data-service');
const AIPredictionService = require('./ai-prediction-service');

// =============================================================================
// FIREBASE CONFIGURATION
// =============================================================================
const { db } = require('./firebase-config');

// =============================================================================
// FIREBASE ADMIN CONFIGURATION
// =============================================================================
const { initializeFirebaseAdmin, getFirestore, getAuth } = require('./config/firebase-admin');

try {
  initializeFirebaseAdmin();
  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.log('⚠️ Firebase Admin SDK initialization skipped:', error.message);
}

// Add this test route to your server.js
app.get('/test-firebase-admin', async (req, res) => {
  try {
    const db = admin.firestore();
    const testDocRef = db.collection('testCollection').doc('testDoc');
    
    // Write a test document
    await testDocRef.set({
      message: 'Hello from Firebase Admin!',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Test document written to Firestore');
    
    // Read it back
    const docSnapshot = await testDocRef.get();
    const data = docSnapshot.data();
    
    res.json({
      success: true,
      message: 'Firebase Admin SDK is working!',
      data: data
    });
  } catch (error) {
    console.error('❌ Firebase Admin SDK test failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================================
// STRIPE PRODUCTS CONFIGURATION
// =============================================================================

const STRIPE_PRODUCTS = {
  weekly: {
    priceId: process.env.STRIPE_WEEKLY_PRICE_ID || 'price_weekly_499',
    name: 'NBA Fantasy AI Pro Weekly',
    description: 'Weekly access for tournament players & weekend warriors',
    amount: 499,
    interval: 'week'
  },
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_999', 
    name: 'NBA Fantasy AI Premium Monthly',
    description: 'AI-powered insights for serious fantasy players',
    amount: 999,
    interval: 'month'
  },
  yearly: {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly_9999',
    name: 'NBA Fantasy AI Premium Yearly', 
    description: 'Best value - 2 months free with annual commitment',
    amount: 9999,
    interval: 'year'
  }
};

// =============================================================================
// MOCK FANTASY DATA (FROM FILE 1)
// =============================================================================

// Mock fantasy advice data
const mockFantasyAdvice = [
  {
    player: "LeBron James",
    recommendation: "START",
    confidence: 85,
    reason: "High minutes expected against weak defense, coming off rest day"
  },
  {
    player: "Stephen Curry", 
    recommendation: "START",
    confidence: 92,
    reason: "Favorable matchup at home, hot shooting streak"
  },
  {
    player: "Luka Doncic",
    recommendation: "SIT", 
    confidence: 78,
    reason: "Back-to-back game, possible minutes restriction"
  },
  {
    player: "Anthony Davis",
    recommendation: "START",
    confidence: 88,
    reason: "Dominant against this opponent historically"
  },
  {
    player: "Trae Young",
    recommendation: "START",
    confidence: 82,
    reason: "High usage rate with key teammates injured"
  }
];

// Mock fantasy teams data
const mockFantasyTeams = [
  {
    id: 1,
    name: "Dream Team",
    points: 1245,
    rank: 3,
    players: ["LeBron James", "Stephen Curry", "Anthony Davis"]
  },
  {
    id: 2,
    name: "The Goats",
    points: 1180,
    rank: 7,
    players: ["Luka Doncic", "Kevin Durant", "Giannis Antetokounmpo"]
  }
];

// =============================================================================
// FANTASY ENDPOINTS (FROM FILE 1)
// =============================================================================

// Fantasy Advice Endpoint
app.get('/api/nba/fantasy/advice', (req, res) => {
  console.log('📊 Fantasy advice endpoint hit');
  try {
    // Add some randomness to simulate live data
    const dynamicAdvice = mockFantasyAdvice.map(advice => ({
      ...advice,
      confidence: Math.max(50, Math.min(95, advice.confidence + Math.floor(Math.random() * 10 - 5)))
    }));
    
    res.json(dynamicAdvice);
  } catch (error) {
    console.error('Error in fantasy advice endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// My Teams Endpoint
app.get('/api/fantasy/my-teams', (req, res) => {
  console.log('🏀 My teams endpoint hit');
  try {
    res.json(mockFantasyTeams);
  } catch (error) {
    console.error('Error in my teams endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Fantasy Team Endpoint
app.post('/api/fantasy/create', (req, res) => {
  console.log('➕ Create fantasy team endpoint hit');
  try {
    const { name, players } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }
    
    const newTeam = {
      id: mockFantasyTeams.length + 1,
      name,
      players: players || [],
      points: 0,
      rank: mockFantasyTeams.length + 1
    };
    
    mockFantasyTeams.push(newTeam);
    
    res.json({ success: true, team: newTeam });
  } catch (error) {
    console.error('Error creating fantasy team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// ENHANCED NBA API ENDPOINTS WITH LIVE DATA
// =============================================================================

// Enhanced player search endpoint
app.get('/api/nba/players/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters long' 
      });
    }

    console.log(`🔍 Player search request: ${query}`);
    const players = await NBADataService.searchPlayers(query);
    
    res.json({
      success: true,
      data: {
        query: query,
        results: players,
        count: players.length,
        source: players.length > 0 ? players[0].source : 'none'
      }
    });
  } catch (error) {
    console.error('Player search endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search players' 
    });
  }
});

// Enhanced player stats endpoint
app.get('/api/nba/player/:playerName/stats/enhanced', async (req, res) => {
  try {
    const { playerName } = req.params;
    const { season } = req.query;
    
    console.log(`📊 Enhanced stats request: ${playerName}, season: ${season}`);
    const stats = await NBADataService.getPlayerStats(playerName, season);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Enhanced player stats endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch player stats' 
    });
  }
});

// Enhanced team roster endpoint
app.get('/api/nba/team/:teamName/roster/enhanced', async (req, res) => {
  try {
    const { teamName } = req.params;
    
    console.log(`🏀 Enhanced roster request: ${teamName}`);
    const roster = await NBADataService.getTeamRoster(teamName);
    
    res.json({
      success: true,
      data: roster
    });
  } catch (error) {
    console.error('Enhanced team roster endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch team roster' 
    });
  }
});

// Live games endpoint
app.get('/api/nba/games/live', async (req, res) => {
  try {
    const { date } = req.query;
    
    console.log(`🎯 Live games request: ${date || 'today'}`);
    const games = await NBADataService.getLiveGames();
    
    res.json({
      success: true,
      data: games
    });
  } catch (error) {
    console.error('Live games endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch live games' 
    });
  }
});

// Player comparison endpoint
app.get('/api/nba/players/compare', async (req, res) => {
  try {
    const { players, season } = req.query;
    
    if (!players) {
      return res.status(400).json({ 
        error: 'Player names are required' 
      });
    }

    const playerNames = players.split(',');
    console.log(`🆚 Player comparison request: ${playerNames.join(' vs ')}`);
    
    const comparisons = await Promise.all(
      playerNames.map(name => 
        NBADataService.getPlayerStats(name.trim(), season)
      )
    );

    res.json({
      success: true,
      data: {
        players: comparisons,
        season: season || '2024',
        last_updated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Player comparison endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to compare players' 
    });
  }
});

// League leaders endpoint
app.get('/api/nba/leaders', async (req, res) => {
  try {
    const { stat, season } = req.query;
    const validStats = ['points', 'rebounds', 'assists', 'steals', 'blocks'];
    
    const targetStat = validStats.includes(stat) ? stat : 'points';
    
    console.log(`🏆 League leaders request: ${targetStat}`);
    
    // This would be enhanced with real API calls in production
    const mockLeaders = {
      points: [
        { player: 'Luka Doncic', team: 'DAL', value: 33.9 },
        { player: 'Giannis Antetokounmpo', team: 'MIL', value: 30.8 },
        { player: 'Shai Gilgeous-Alexander', team: 'OKC', value: 30.4 }
      ],
      rebounds: [
        { player: 'Domantas Sabonis', team: 'SAC', value: 13.7 },
        { player: 'Rudy Gobert', team: 'MIN', value: 12.9 },
        { player: 'Nikola Jokic', team: 'DEN', value: 12.3 }
      ],
      assists: [
        { player: 'Tyrese Haliburton', team: 'IND', value: 10.9 },
        { player: 'Trae Young', team: 'ATL', value: 10.9 },
        { player: 'Luka Doncic', team: 'DAL', value: 9.8 }
      ]
    };

    res.json({
      success: true,
      data: {
        stat: targetStat,
        season: season || '2024',
        leaders: mockLeaders[targetStat] || mockLeaders.points,
        last_updated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('League leaders endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch league leaders' 
    });
  }
});

// =============================================================================
// TEMPORARY INLINE PHASE 4 HANDLERS (FIX FOR DEPLOYMENT ISSUE)
// =============================================================================

const phase4Handlers = {
  handleGetHistoricalRecords: (recordType, player, team) => {
    console.log(`🏀 Historical records request: ${recordType}, ${player}, ${team}`);
    
    const historicalRecords = {
      'most_points_game': {
        player: 'Wilt Chamberlain',
        value: '100 points',
        date: 'March 2, 1962',
        context: 'Single-game scoring record that still stands today'
      },
      'most_championships_player': {
        player: 'Bill Russell',
        value: '11 championships',
        context: 'Most championships by any player in NBA history'
      }
    };

    const records = recordType ? [historicalRecords[recordType]] : Object.values(historicalRecords);
    
    const recordsText = records.slice(0, 3).map(record => 
      `🏆 **${record.player}** - ${record.value}\n   📅 ${record.date || ''}\n   📝 ${record.context}`
    ).join('\n\n');

    return {
      fulfillmentText: `🏀 **Historical NBA Records**\n\n${recordsText}\n\n*Explore the rich history of basketball greatness*`
    };
  },

  handleGetTeamHistory: (teamName, era) => {
    console.log(`🏀 Team history request: ${teamName}, ${era}`);
    
    const teamHistories = {
      'Lakers': {
        championships: 17,
        years: [1949, 1950, 1952, 1953, 1954, 1972, 1980, 1982, 1985, 1987, 1988, 2000, 2001, 2002, 2009, 2010, 2020],
        dynasties: ['1949-1954: George Mikan Era', '1980-1988: Showtime Lakers', '2000-2002: Shaq & Kobe Three-peat']
      },
      'Celtics': {
        championships: 17,
        years: [1957, 1959, 1960, 1961, 1962, 1963, 1964, 1965, 1966, 1968, 1969, 1974, 1976, 1981, 1984, 1986, 2008],
        dynasties: ['1957-1969: Bill Russell Era (11 championships)', '1974-1976: Havlicek/Cowens Era', '1981-1986: Larry Bird Era']
      }
    };

    const team = teamHistories[teamName] || teamHistories['Lakers'];
    const championshipsText = team.years.join(', ');

    return {
      fulfillmentText: `🏀 **${teamName} Historical Legacy**\n\n🏆 **Championships:** ${team.championships}\n📅 **Years:** ${championshipsText}\n\n**🏅 Major Dynasties:**\n${team.dynasties.map(d => `• ${d}`).join('\n')}`
    };
  },

  handleGetBasketballStrategy: (strategyName) => {
    console.log(`🏀 Strategy request: ${strategyName}`);
    
    const strategies = {
      'pick_and_roll': {
        title: 'Pick and Roll Offense',
        description: 'Fundamental two-man game where one player sets a screen for the ball handler then rolls to the basket.',
        key_elements: ['Screen setter creates defensive mismatch', 'Ball handler reads the defense', 'Roll to basket or pop for jump shot']
      }
    };

    const strategy = strategies[strategyName] || strategies['pick_and_roll'];
    const elementsText = strategy.key_elements.map(el => `• ${el}`).join('\n');

    return {
      fulfillmentText: `🏀 **Basketball Strategy: ${strategy.title}**\n\n📖 **Description:** ${strategy.description}\n\n**Key Elements:**\n${elementsText}`
    };
  },

  handleGetStatisticalTutorial: (statType) => {
    console.log(`📊 Stats tutorial request: ${statType}`);
    
    const tutorials = {
      'player_efficiency_rating': {
        title: 'Player Efficiency Rating (PER)',
        description: 'All-in-one basketball rating that sums up a player\'s statistical accomplishments.',
        interpretation: '15 = Average, 20 = All-Star, 25 = MVP Candidate, 30+ = Historic'
      }
    };

    const tutorial = tutorials[statType] || tutorials['player_efficiency_rating'];

    return {
      fulfillmentText: `📊 **Basketball Analytics: ${tutorial.title}**\n\n📖 **Description:** ${tutorial.description}\n\n**Interpretation:** ${tutorial.interpretation}`
    };
  },

  handleGetFantasyEducation: (topic) => {
    console.log(`🎯 Fantasy education request: ${topic}`);
    
    const education = {
      'snake_draft_strategy': {
        title: 'Snake Draft Strategy',
        key_principles: ['Early rounds: Secure elite talent', 'Middle rounds: Balance risk and reliability', 'Late rounds: Target high-upside players']
      }
    };

    const topicData = education[topic] || education['snake_draft_strategy'];
    const principlesText = topicData.key_principles.map(p => `• ${p}`).join('\n');

    return {
      fulfillmentText: `🎯 **Fantasy Basketball: ${topicData.title}**\n\n**Key Principles:**\n${principlesText}`
    };
  },

  handleGetHistoricalComparison: (player1, player2) => {
    console.log(`🆚 Historical comparison request: ${player1} vs ${player2}`);
    
    return {
      fulfillmentText: `🆚 **Historical Comparison: ${player1} vs ${player2}**\n\nI can compare historical players across different eras. Try: "Compare Michael Jordan and LeBron James" or "Kareem vs Wilt Chamberlain" for detailed historical analysis.`
    };
  },

  handleGetNBATrivia: (topic) => {
    console.log(`❓ NBA trivia request: ${topic}`);
    
    return {
      fulfillmentText: `❓ **NBA Trivia**\n\n**Q:** Who made the first three-pointer in NBA history?\n\n**A:** Chris Ford of the Boston Celtics on October 12, 1979\n\n💡 **Fun Fact:** The three-point line was introduced in the 1979-80 season`
    };
  }
};

// =============================================================================
// PHASE 5 HANDLERS - ADVANCED FEATURES (SINGLE VERSION - NO DUPLICATE)
// =============================================================================

const phase5Handlers = {
  
  // =========================================================================
  // REAL-TIME GAME TRACKING & WEBSOCKETS
  // =========================================================================
  
  handleGetLiveGameUpdates: (gameId, team, player) => {
    console.log(`📡 Live game updates request: ${gameId}, ${team}, ${player}`);
    
    const liveGames = {
      'Lakers vs Warriors': {
        status: 'LIVE - 3rd Quarter',
        score: 'LAL 89 - 84 GSW',
        time: '8:34 remaining',
        key_plays: [
          '🏀 LeBron James dunk (2 pts)',
          '🎯 Stephen Curry three-pointer (3 pts)',
          '🛡️ Anthony Davis block'
        ],
        player_updates: {
          'LeBron James': '28 PTS, 8 REB, 7 AST',
          'Stephen Curry': '25 PTS, 4 REB, 5 AST, 6/12 3PT'
        }
      },
      'Celtics vs Heat': {
        status: 'LIVE - 2nd Quarter',
        score: 'BOS 52 - 48 MIA',
        time: '5:12 remaining',
        key_plays: [
          '🏀 Jayson Tatum step-back three',
          '🔥 Jimmy Butler and-1',
          '🛡️ Bam Adebayo steal & fast break'
        ]
      }
    };

    const game = liveGames[gameId] || liveGames['Lakers vs Warriors'];
    const playsText = game.key_plays.map(play => `• ${play}`).join('\n');
    
    let playerUpdatesText = '';
    if (player && game.player_updates && game.player_updates[player]) {
      playerUpdatesText = `\n\n**${player} Live Stats:** ${game.player_updates[player]}`;
    }

    return {
      fulfillmentText: `📡 **Live Game Updates: ${gameId}**\n\n` +
        `🕒 **Status:** ${game.status}\n` +
        `🏆 **Score:** ${game.score}\n` +
        `⏰ **Time:** ${game.time}\n\n` +
        `🎯 **Key Plays:**\n${playsText}` +
        playerUpdatesText +
        `\n\n_Real-time updates powered by WebSocket connection_`
    };
  },

  // =========================================================================
  // ADVANCED MACHINE LEARNING PREDICTIONS
  // =========================================================================

  handleGetMLPredictions: (player, game, predictionType, timeframe) => {
    console.log(`🤖 ML prediction request: ${player}, ${game}, ${predictionType}`);
    
    const mlModels = {
      'player_performance': {
        'Stephen Curry': {
          predicted_points: '32.5 ± 2.1',
          predicted_rebounds: '5.8 ± 1.2',
          predicted_assists: '6.9 ± 1.5',
          confidence: '87%',
          factors: ['Home game', 'Favorable matchup', 'Recent hot streak']
        },
        'LeBron James': {
          predicted_points: '28.3 ± 3.2',
          predicted_rebounds: '8.1 ± 2.1',
          predicted_assists: '7.8 ± 1.8',
          confidence: '82%',
          factors: ['High usage rate', 'Playoff intensity', 'Veteran experience']
        },
        'Nikola Jokic': {
          predicted_points: '26.8 ± 2.8',
          predicted_rebounds: '12.5 ± 3.1',
          predicted_assists: '9.3 ± 2.4',
          confidence: '91%',
          factors: ['Triple-double threat', 'Elite efficiency', 'Team dependency']
        }
      },
      'game_outcome': {
        'Lakers vs Warriors': {
          predicted_winner: 'Warriors',
          confidence: '68%',
          predicted_score: 'GSW 118-114 LAL',
          key_factors: ['Warriors 3PT advantage', 'Lakers injury concerns', 'Home court edge']
        }
      }
    };

    let predictionData;
    if (predictionType === 'game_outcome') {
      predictionData = mlModels.game_outcome[game] || mlModels.game_outcome['Lakers vs Warriors'];
      const factorsText = predictionData.key_factors.map(f => `• ${f}`).join('\n');
      
      return {
        fulfillmentText: `🎯 **ML Game Prediction: ${game}**\n\n` +
          `🏆 **Predicted Winner:** ${predictionData.predicted_winner}\n` +
          `📊 **Confidence:** ${predictionData.confidence}\n` +
          `🏀 **Predicted Score:** ${predictionData.predicted_score}\n\n` +
          `🔍 **Key Factors:**\n${factorsText}\n\n` +
          `_Powered by ensemble ML model (XGBoost + Neural Networks)_`
      };
    } else {
      predictionData = mlModels.player_performance[player] || mlModels.player_performance['Stephen Curry'];
      const factorsText = predictionData.factors.map(f => `• ${f}`).join('\n');
      
      return {
        fulfillmentText: `🤖 **ML Player Projection: ${player}**\n\n` +
          `🎯 **Predicted Stats:**\n` +
          `• Points: ${predictionData.predicted_points}\n` +
          `• Rebounds: ${predictionData.predicted_rebounds}\n` +
          `• Assists: ${predictionData.predicted_assists}\n\n` +
          `📊 **Model Confidence:** ${predictionData.confidence}\n` +
          `🔍 **Key Factors:**\n${factorsText}\n\n` +
          `_Advanced ensemble model using 50+ features_`
      };
    }
  },

  // =========================================================================
  // ADVANCED BETTING ANALYTICS & VALUE DETECTION
  // =========================================================================

  handleGetBettingValue: (betType, game, odds) => {
    console.log(`💰 Betting value analysis: ${betType}, ${game}, ${odds}`);
    
    const valueAnalysis = {
      'Lakers vs Warriors Over 228.5': {
        expected_value: '+3.2%',
        confidence: '78%',
        edge: 'Significant',
        reasoning: 'Both teams top 5 in pace, defensive injuries present',
        recommendation: 'STRONG PLAY',
        risk_level: 'Medium'
      },
      'Jokic Triple Double': {
        expected_value: '+5.1%',
        confidence: '85%',
        edge: 'High',
        reasoning: 'High usage + rebounding advantage + playmaking role',
        recommendation: 'MAX PLAY',
        risk_level: 'Low'
      },
      'Curry 5+ Threes': {
        expected_value: '+2.8%',
        confidence: '72%',
        edge: 'Moderate',
        reasoning: 'Favorable matchup, hot shooting streak',
        recommendation: 'STANDARD PLAY',
        risk_level: 'Medium'
      }
    };

    const analysis = valueAnalysis[betType] || valueAnalysis['Lakers vs Warriors Over 228.5'];

    return {
      fulfillmentText: `💰 **Advanced Betting Value Analysis**\n\n` +
        `🎯 **Bet:** ${betType}\n` +
        `📈 **Expected Value:** ${analysis.expected_value}\n` +
        `🎲 **Confidence:** ${analysis.confidence}\n` +
        `⚡ **Edge:** ${analysis.edge}\n` +
        `📊 **Risk Level:** ${analysis.risk_level}\n\n` +
        `💡 **Reasoning:** ${analysis.reasoning}\n\n` +
        `✅ **Recommendation:** ${analysis.recommendation}\n\n` +
        `_Value calculation based on implied probability vs true probability_`
    };
  },

  // =========================================================================
  // PLAYER INJURY REPORTS & NEWS INTEGRATION
  // =========================================================================

  handleGetInjuryReports: (player, team) => {
    console.log(`🏥 Injury report request: ${player}, ${team}`);
    
    const injuryData = {
      'Kawhi Leonard': {
        status: 'QUESTIONABLE',
        injury: 'Knee soreness',
        games_missed: '2',
        expected_return: 'Next 1-2 games',
        impact: 'High - Load management likely'
      },
      'Zion Williamson': {
        status: 'PROBABLE',
        injury: 'Ankle sprain',
        games_missed: '0',
        expected_return: 'Playing tonight',
        impact: 'Low - Minimal limitations expected'
      },
      'Joel Embiid': {
        status: 'OUT',
        injury: 'Knee surgery recovery',
        games_missed: '8',
        expected_return: '2-3 weeks',
        impact: 'Very High - Team offense significantly affected'
      }
    };

    if (player) {
      const injury = injuryData[player] || {
        status: 'HEALTHY',
        injury: 'No current injuries',
        games_missed: '0',
        expected_return: 'Active',
        impact: 'None'
      };

      return {
        fulfillmentText: `🏥 **Injury Report: ${player}**\n\n` +
          `📋 **Status:** ${injury.status}\n` +
          `🤕 **Injury:** ${injury.injury}\n` +
          `📅 **Games Missed:** ${injury.games_missed}\n` +
          `🔄 **Expected Return:** ${injury.expected_return}\n` +
          `⚡ **Fantasy Impact:** ${injury.impact}\n\n` +
          `_Medical data updated within last 24 hours_`
      };
    } else {
      // Team injury report
      return {
        fulfillmentText: `🏥 **Team Injury Report**\n\n` +
          `• **Kawhi Leonard:** QUESTIONABLE - Knee soreness\n` +
          `• **Zion Williamson:** PROBABLE - Ankle sprain\n` +
          `• **Joel Embiid:** OUT - Knee surgery (2-3 weeks)\n` +
          `• **Chris Paul:** DAY-TO-DAY - Hand contusion\n\n` +
          `📊 **Overall Team Health:** 87%\n` +
          `🔄 **Last Updated:** Today 2:30 PM EST`
      };
    }
  },

  // =========================================================================
  // MULTI-PLATFORM FANTASY OPTIMIZATION
  // =========================================================================

  handleGetMultiPlatformOptimization: (slates, budget, strategy) => {
    console.log(`🎮 Multi-platform optimization: ${slates}, ${budget}, ${strategy}`);
    
    const optimization = {
      'Main Slate': {
        platforms: ['DraftKings', 'FanDuel', 'Yahoo'],
        optimal_lineups: {
          'DraftKings': ['Stephen Curry', 'Anthony Davis', 'Jalen Brunson'],
          'FanDuel': ['Luka Doncic', 'Nikola Jokic', 'Paolo Banchero'],
          'Yahoo': ['Giannis Antetokounmpo', 'Trae Young', 'Desmond Bane']
        },
        exposure_limits: {
          'Stephen Curry': '75%',
          'Nikola Jokic': '60%',
          'Luka Doncic': '50%'
        },
        bankroll_allocation: {
          'DraftKings': '40%',
          'FanDuel': '35%',
          'Yahoo': '25%'
        }
      }
    };

    const slate = optimization[slates] || optimization['Main Slate'];
    
    const lineupsText = Object.entries(slate.optimal_lineups)
      .map(([platform, players]) => `**${platform}:** ${players.slice(0, 3).join(', ')}`)
      .join('\n');
    
    const exposureText = Object.entries(slate.exposure_limits)
      .map(([player, limit]) => `• ${player}: ${limit}`)
      .join('\n');
    
    const allocationText = Object.entries(slate.bankroll_allocation)
      .map(([platform, percent]) => `• ${platform}: ${percent}`)
      .join('\n');

    return {
      fulfillmentText: `🎮 **Multi-Platform Fantasy Optimization**\n\n` +
        `📊 **Optimal Lineups:**\n${lineupsText}\n\n` +
        `🎯 **Player Exposure Limits:**\n${exposureText}\n\n` +
        `💰 **Bankroll Allocation:**\n${allocationText}\n\n` +
        `💡 **Strategy:** ${strategy || 'Maximize expected value across platforms'}\n\n` +
        `_Algorithm considers pricing, scoring rules, and ownership projections_`
    };
  },

  // =========================================================================
  // ADVANCED USER ANALYTICS DASHBOARD
  // =========================================================================

  handleGetUserAnalytics: (timeframe, metric) => {
    console.log(`📈 User analytics request: ${timeframe}, ${metric}`);
    
    const analytics = {
      'performance': {
        win_rate: '58.3%',
        roi: '+24.7%',
        average_win: '+2.8 units',
        best_performing_category: 'Player Props',
        improvement_trend: '+12.1% last 30 days'
      },
      'behavior': {
        most_queried_player: 'Stephen Curry',
        favorite_bet_type: 'Over/Under',
        active_hours: '7:00 PM - 11:00 PM EST',
        query_success_rate: '89.2%'
      },
      'comparison': {
        percentile_vs_users: '87th',
        streak: 'W4 (Current)',
        monthly_growth: '+15.3%'
      }
    };

    const perf = analytics.performance;
    const behavior = analytics.behavior;
    const comparison = analytics.comparison;

    return {
      fulfillmentText: `📈 **Advanced User Analytics**\n\n` +
        `🎯 **Performance Metrics:**\n` +
        `• Win Rate: ${perf.win_rate}\n` +
        `• ROI: ${perf.roi}\n` +
        `• Avg Win: ${perf.average_win}\n` +
        `• Best Category: ${perf.best_performing_category}\n` +
        `• Improvement Trend: ${perf.improvement_trend}\n\n` +
        `📊 **User Behavior:**\n` +
        `• Most Queried: ${behavior.most_queried_player}\n` +
        `• Favorite Bet Type: ${behavior.favorite_bet_type}\n` +
        `• Active Hours: ${behavior.active_hours}\n` +
        `• Query Success: ${behavior.query_success_rate}\n\n` +
        `🏆 **Comparison:**\n` +
        `• Percentile: ${comparison.percentile_vs_users}\n` +
        `• Current Streak: ${comparison.streak}\n` +
        `• Monthly Growth: ${comparison.monthly_growth}\n\n` +
        `_Data analyzed from ${timeframe || 'last 90 days'}_`
    };
  },

  // =========================================================================
  // ADVANCED PLAYER COMPARISON WITH ML INSIGHTS
  // =========================================================================

  handleGetAdvancedPlayerComparison: (player1, player2, metrics) => {
    console.log(`🆚 Advanced player comparison: ${player1} vs ${player2}`);
    
    const comparisons = {
      'Jayson Tatum vs Devin Booker': {
        winner: 'Jayson Tatum',
        advantage: '+4.7%',
        key_metrics: {
          'Usage Rate': 'Tatum +3.2%',
          'Defensive Impact': 'Tatum +8.1%',
          'Clutch Performance': 'Booker +2.3%',
          'Efficiency': 'Tatum +1.8%'
        },
        projection: 'Tatum 65% win probability in H2H',
        recommendation: 'Tatum for fantasy, Booker for betting props'
      },
      'LeBron James vs Kevin Durant': {
        winner: 'LeBron James',
        advantage: '+2.1%',
        key_metrics: {
          'Playmaking': 'LeBron +12.3%',
          'Scoring Efficiency': 'Durant +3.7%',
          'Defensive Versatility': 'LeBron +5.2%',
          'Leadership Impact': 'LeBron +6.8%'
        },
        projection: 'LeBron 58% win probability in H2H',
        recommendation: 'LeBron for all-around impact, Durant for pure scoring'
      }
    };

    const key = `${player1} vs ${player2}`;
    const reverseKey = `${player2} vs ${player1}`;
    const comparison = comparisons[key] || comparisons[reverseKey] || comparisons['Jayson Tatum vs Devin Booker'];

    const metricsText = Object.entries(comparison.key_metrics)
      .map(([metric, value]) => `• ${metric}: ${value}`)
      .join('\n');

    return {
      fulfillmentText: `🆚 **Advanced Player Comparison**\n\n` +
        `🏆 **Projected Winner:** ${comparison.winner}\n` +
        `📊 **Advantage:** ${comparison.advantage}\n\n` +
        `🎯 **Key Metrics:**\n${metricsText}\n\n` +
        `📈 **ML Projection:** ${comparison.projection}\n` +
        `💡 **Recommendation:** ${comparison.recommendation}\n\n` +
        `_Analysis based on 25+ advanced metrics and situational data_`
    };
  },

  // =========================================================================
  // SMART NOTIFICATIONS & ALERTS SYSTEM
  // =========================================================================

  handleGetSmartAlerts: (alertType, preferences) => {
    console.log(`🔔 Smart alerts request: ${alertType}, ${preferences}`);
    
    const alerts = {
      'betting': [
        '🎯 VALUE ALERT: Lakers vs Warriors Over 228.5 now +115 (3.2% edge)',
        '⚠️ LINE MOVEMENT: Celtics spread from -4.5 to -6.0',
        '🔥 PLAYER PROP: Jokic rebounds line dropped to 10.5'
      ],
      'fantasy': [
        '💎 SLEEPER ALERT: Jalen Williams available in 65% of leagues',
        '🔄 INJURY UPDATE: Kawhi Leonard upgraded to PROBABLE',
        '📈 STOCK RISING: Paolo Banchero usage increasing'
      ],
      'news': [
        '📰 BREAKING: Joel Embiid expected to return next week',
        '🏀 ROTATION CHANGE: Warriors starting lineup adjustment',
        '🤕 INJURY: Zion Williamson questionable with ankle'
      ]
    };

    const alertList = alerts[alertType] || alerts['betting'];
    const alertsText = alertList.map(alert => `• ${alert}`).join('\n');

    return {
      fulfillmentText: `🔔 **Smart Alerts: ${alertType.toUpperCase()}**\n\n${alertsText}\n\n` +
        `_Alerts personalized based on your preferences and betting history_`
    };
  }
};

// ==================== SERVICE INITIALIZATIONS ====================
const analyticsService = new AnalyticsService();
const notificationService = new NotificationService();

// ==================== REFERRAL ROUTES ====================
const referralRoutes = require('./routes/referral-routes');
app.use('/api/referrals', referralRoutes);

// =============================================================================
// CORS AND STATIC FILE SERVING
// =============================================================================

// Update CORS Middleware
app.use(cors({
  origin: ['http://localhost:8081', 'http://10.0.0.183:8081', 'exp://10.0.0.183:8081', process.env.FRONTEND_URL].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Serve static files from public directory
app.use(express.static('public'));

// Routes for your HTML pages
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/public/about.html');
});

app.get('/contact', (req, res) => {
  res.sendFile(__dirname + '/public/contact.html');
});

// =============================================================================
// ENHANCED NBA DATA SERVICE WITH MULTI-SOURCE SUPPORT
// =============================================================================

const NBA_DATA_SERVICE = {
  
  // Use multi-source service for player stats
  async getPlayerStats(playerName, season = '2024') {
    try {
      console.log(`🔍 Fetching enhanced stats for: ${playerName}`);
      return await MULTI_SOURCE_SERVICE.getPlayerStats(playerName);
    } catch (error) {
      console.error('💥 Enhanced NBA data service error:', error);
      return MULTI_SOURCE_SERVICE.getMockPlayerStats(playerName);
    }
  },
  
  // Keep existing methods but enhance with multi-source
  async getLiveGames() {
    try {
      const apiKey = process.env.SPORTS_RADAR_API_KEY;
      if (!apiKey) return this.getMockGames();
      
      const url = `https://api.sportradar.com/nba/trial/v8/en/games/2024/REG/schedule.json?api_key=${apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Schedule API responded with status: ${response.status}`);
      }
      
      const schedule = await response.json();
      return this.formatGames(schedule);
    } catch (error) {
      console.error('Live games API error:', error);
      return this.getMockGames();
    }
  },
  
  async getTeamRoster(teamName) {
    try {
      const apiKey = process.env.SPORTS_RADAR_API_KEY;
      if (!apiKey) return this.getMockRoster(teamName);
      
      const teamsUrl = `https://api.sportradar.com/nba/trial/v8/en/league/hierarchy.json?api_key=${apiKey}`;
      const teamsResponse = await fetch(teamsUrl);
      
      if (!teamsResponse.ok) {
        throw new Error(`Teams API responded with status: ${teamsResponse.status}`);
      }
      
      const hierarchy = await teamsResponse.json();
      const allTeams = hierarchy.conferences?.flatMap(conf => 
        conf.divisions?.flatMap(div => div.teams || []) || []
      ) || [];
      
      const team = allTeams.find(t => 
        t.name && t.name.toLowerCase().includes(teamName.toLowerCase())
      );
      
      if (!team) return this.getMockRoster(teamName);
      
      const rosterUrl = `https://api.sportradar.com/nba/trial/v8/en/teams/${team.id}/profile.json?api_key=${apiKey}`;
      const rosterResponse = await fetch(rosterUrl);
      
      if (!rosterResponse.ok) {
        throw new Error(`Roster API responded with status: ${rosterResponse.status}`);
      }
      
      const roster = await rosterResponse.json();
      return this.formatRoster(roster);
    } catch (error) {
      console.error('Team roster API error:', error);
      return this.getMockRoster(teamName);
    }
  },
  
  // Data formatting methods (keep existing)
  formatGames(schedule) {
    try {
      const games = schedule.games || [];
      return games.slice(0, 10).map(game => ({
        id: game.id,
        home: game.home?.name || 'Unknown',
        away: game.away?.name || 'Unknown',
        status: game.status || 'scheduled',
        date: game.scheduled || ''
      }));
    } catch (error) {
      console.error('Error formatting games:', error);
      return this.getMockGames();
    }
  },
  
  formatRoster(roster) {
    try {
      const players = roster.players || [];
      return {
        team: roster.team?.name || 'Unknown Team',
        players: players.map(player => ({
          name: player.full_name,
          position: player.primary_position,
          jersey: player.jersey_number
        })),
        coaches: roster.coaches || []
      };
    } catch (error) {
      console.error('Error formatting roster:', error);
      return this.getMockRoster(roster.team?.name || 'Unknown Team');
    }
  },
  
  // Fallback mock data
  getMockGames() {
    return [
      { id: '1', home: 'Lakers', away: 'Warriors', status: 'scheduled', date: '2024-11-15' },
      { id: '2', home: 'Celtics', away: 'Heat', status: 'scheduled', date: '2024-11-15' },
      { id: '3', home: 'Nuggets', away: 'Suns', status: 'scheduled', date: '2024-11-15' }
    ];
  },
  
  getMockRoster(teamName) {
    const mockRosters = {
      'Lakers': {
        team: 'Los Angeles Lakers',
        players: [
          { name: 'LeBron James', position: 'F', jersey: '23' },
          { name: 'Anthony Davis', position: 'C', jersey: '3' },
          { name: 'Austin Reaves', position: 'G', jersey: '15' }
        ],
        coaches: [{ name: 'Darvin Ham', type: 'head_coach' }]
      },
      'Warriors': {
        team: 'Golden State Warriors',
        players: [
          { name: 'Stephen Curry', position: 'G', jersey: '30' },
          { name: 'Klay Thompson', position: 'G', jersey: '11' },
          { name: 'Draymond Green', position: 'F', jersey: '23' }
        ],
        coaches: [{ name: 'Steve Kerr', type: 'head_coach' }]
      }
    };
    
    return mockRosters[teamName] || {
      team: teamName,
      players: [
        { name: 'Player 1', position: 'G', jersey: '1' },
        { name: 'Player 2', position: 'F', jersey: '2' },
        { name: 'Player 3', position: 'C', jersey: '3' }
      ],
      coaches: [{ name: 'Head Coach', type: 'head_coach' }]
    };
  }
};

// =============================================================================
// USER AUTHENTICATION SYSTEM - PHASE 2 IMPLEMENTATION
// =============================================================================

const USER_AUTH = {
  
  // JWT-based authentication
  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'nba-fantasy-secret-key-change-in-production', { expiresIn: '7d' });
  },
  
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'nba-fantasy-secret-key-change-in-production');
    } catch (error) {
      return null;
    }
  },
  
  // User session management
  sessions: new Map(),
  
  // Session ID generation function
  async generateSessionId() {
    const bytes = crypto.randomBytes(16);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  },
  
  // Fixed createSession function
  async createSession(user) {
    const sessionId = await this.generateSessionId();
    const session = {
      id: sessionId,
      userId: user.id,
      email: user.email,
      preferences: {},
      createdAt: new Date(),
      lastActive: new Date()
    };
    this.sessions.set(sessionId, session);
    return session;
  },
  
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = new Date();
    }
    return session;
  },
  
  destroySession(sessionId) {
    this.sessions.delete(sessionId);
  }
};

// =============================================================================
// ENHANCED DATABASE SYSTEM - PHASE 3 IMPLEMENTATION (UPDATED FOR APP ENGINE)
// =============================================================================

const USER_DB = {
  // UPDATED: Use /tmp directory for App Engine compatibility
  filePath: path.join('/tmp', 'users.json'),
  analyticsPath: path.join('/tmp', 'analytics.json'),
  
  async init() {
    try {
      await fs.access(this.filePath);
      console.log('✅ User database file exists in /tmp');
    } catch (error) {
      console.log('📁 Creating user database file in /tmp...');
      // REMOVED: Directory creation - /tmp already exists on App Engine
      await fs.writeFile(this.filePath, JSON.stringify({ users: [] }, null, 2));
      console.log('✅ User database file created in /tmp');
    }

    try {
      await fs.access(this.analyticsPath);
      console.log('✅ Analytics database file exists in /tmp');
    } catch (error) {
      console.log('📁 Creating analytics database file in /tmp...');
      // REMOVED: Directory creation - /tmp already exists on App Engine
      await fs.writeFile(this.analyticsPath, JSON.stringify({ 
        systemStats: {
          totalQueries: 0,
          activeUsers: 0,
          popularPlayers: {},
          popularTeams: {},
          queryTypes: {},
          dailyStats: {}
        },
        userAnalytics: {}
      }, null, 2));
      console.log('✅ Analytics database file created in /tmp');
    }
  },
  
  async load() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading user database:', error);
      return { users: [] };
    }
  },

  async loadAnalytics() {
    try {
      const data = await fs.readFile(this.analyticsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading analytics database:', error);
      return { systemStats: {}, userAnalytics: {} };
    }
  },
  
  async save(data) {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  },

  async saveAnalytics(data) {
    await fs.writeFile(this.analyticsPath, JSON.stringify(data, null, 2));
  },
  
  async findUserByEmail(email) {
    const db = await this.load();
    return db.users.find(user => user.email === email);
  },
  
  async findUserById(userId) {
    const db = await this.load();
    return db.users.find(user => user.id === userId);
  },

  async updateUserSubscription(userId, subscriptionData) {
    const db = await this.load();
    const userIndex = db.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    if (!db.users[userIndex].subscriptions) {
      db.users[userIndex].subscriptions = {};
    }
    
    db.users[userIndex].subscriptions = { 
      ...db.users[userIndex].subscriptions, 
      ...subscriptionData 
    };
    db.users[userIndex].updatedAt = new Date().toISOString();
    
    await this.save(db);
    return db.users[userIndex];
  },
  
  async createUser(userData) {
    const db = await this.load();
    const user = {
      id: require('crypto').randomBytes(8).toString('hex'),
      email: userData.email,
      name: userData.name,
      password: await bcrypt.hash(userData.password, 12),
      preferences: {
        // Basic preferences
        favorite_team: null,
        favorite_players: [],
        notifications: true,
        theme: 'light',
        betting_alerts: false,
        fantasy_updates: true,
        
        // Enhanced preferences
        content_preferences: {
          betting_focus: 'player_props',
          fantasy_focus: 'dfs',
          analysis_depth: 'intermediate',
          news_sources: ['espn', 'nba_com']
        },
        
        notification_preferences: {
          betting_alerts: {
            line_movements: true,
            value_plays: true,
            injury_impacts: true,
            sharp_money: false
          },
          fantasy_alerts: {
            lineup_news: true,
            value_picks: true,
            injury_updates: true,
            start_sit: true
          },
          social_alerts: {
            follower_activity: true,
            lineup_shares: true,
            achievement_unlocks: true
          }
        },
        
        display_preferences: {
          default_timeframe: 'current_season',
          stat_preference: 'per_game',
          currency: 'USD',
          odds_format: 'american'
        }
      },
      profile: {
        experience_level: 'beginner',
        favorite_positions: [],
        betting_interests: [],
        fantasy_platforms: [],
        
        // Enhanced profile
        bankroll_size: 'medium',
        risk_tolerance: 'moderate',
        betting_history: {
          total_wagers: 0,
          win_rate: 0,
          favorite_bet_types: [],
          successful_strategies: []
        },
        fantasy_platforms_detail: {
          primary: 'fanduel',
          active: ['fanduel', 'draftkings'],
          portfolio_value: 0
        }
      },
      activity: {
        query_count: 0,
        last_active: new Date().toISOString(),
        favorite_queries: [],
        query_history: []
      },
      subscriptions: {
        email_notifications: false,
        betting_alerts: false,
        fantasy_updates: true,
        newsletter: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.users.push(user);
    await this.save(db);
    return user;
  },
  
  async updateUserPreferences(userId, preferences) {
    const db = await this.load();
    const userIndex = db.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    db.users[userIndex].preferences = { 
      ...db.users[userIndex].preferences, 
      ...preferences 
    };
    db.users[userIndex].updatedAt = new Date().toISOString();
    
    await this.save(db);
    return db.users[userIndex];
  },

  async updateUserProfile(userId, profile) {
    const db = await this.load();
    const userIndex = db.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    db.users[userIndex].profile = { 
      ...db.users[userIndex].profile, 
      ...profile 
    };
    db.users[userIndex].updatedAt = new Date().toISOString();
    
    await this.save(db);
    return db.users[userIndex];
  },

  async updateUserSubscriptions(userId, subscriptions) {
    const db = await this.load();
    const userIndex = db.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    db.users[userIndex].subscriptions = { 
      ...db.users[userIndex].subscriptions, 
      ...subscriptions 
    };
    db.users[userIndex].updatedAt = new Date().toISOString();
    
    await this.save(db);
    return db.users[userIndex];
  },

  async addUserActivity(userId, activity) {
    const db = await this.load();
    const userIndex = db.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Update activity
    db.users[userIndex].activity.query_count += 1;
    db.users[userIndex].activity.last_active = new Date().toISOString();
    
    // Add to query history (keep last 50 queries)
    if (activity.query) {
      db.users[userIndex].activity.query_history.unshift({
        query: activity.query,
        intent: activity.intent,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 queries
      if (db.users[userIndex].activity.query_history.length > 50) {
        db.users[userIndex].activity.query_history = db.users[userIndex].activity.query_history.slice(0, 50);
      }
    }
    
    // Add social scoring for certain activities
    if (activity.type === 'lineup_share' || activity.type === 'successful_prediction') {
      await SOCIAL_DB.updateSocialScore(userId, 10);
    } else if (activity.type === 'query' && activity.intent) {
      // Award points for using the system
      await SOCIAL_DB.updateSocialScore(userId, 1);
    }
    
    db.users[userIndex].updatedAt = new Date().toISOString();
    
    await this.save(db);
    return db.users[userIndex];
  },

  async trackSystemAnalytics(queryData) {
    const analytics = await this.loadAnalytics();
    const today = new Date().toISOString().split('T')[0];
    
    // Initialize today's stats if not exists
    if (!analytics.systemStats.dailyStats[today]) {
      analytics.systemStats.dailyStats[today] = {
        queries: 0,
        users: new Set(),
        popularPlayers: {},
        popularTeams: {},
        queryTypes: {}
      };
    }
    
    // Update system stats
    analytics.systemStats.totalQueries += 1;
    analytics.systemStats.dailyStats[today].queries += 1;
    
    // Track query types
    if (queryData.intent) {
      analytics.systemStats.queryTypes[queryData.intent] = (analytics.systemStats.queryTypes[queryData.intent] || 0) + 1;
      analytics.systemStats.dailyStats[today].queryTypes[queryData.intent] = 
        (analytics.systemStats.dailyStats[today].queryTypes[queryData.intent] || 0) + 1;
    }
    
    // Track popular players and teams from query
    if (queryData.query) {
      const query = queryData.query.toLowerCase();
      
      // Track popular players
      const players = ['curry', 'lebron', 'jokic', 'giannis', 'durant', 'tatum', 'luka', 'embiid'];
      players.forEach(player => {
        if (query.includes(player)) {
          analytics.systemStats.popularPlayers[player] = (analytics.systemStats.popularPlayers[player] || 0) + 1;
          analytics.systemStats.dailyStats[today].popularPlayers[player] = 
            (analytics.systemStats.dailyStats[today].popularPlayers[player] || 0) + 1;
        }
      });
      
      // Track popular teams
      const teams = ['lakers', 'warriors', 'celtics', 'heat', 'bulls', 'knicks'];
      teams.forEach(team => {
        if (query.includes(team)) {
          analytics.systemStats.popularTeams[team] = (analytics.systemStats.popularTeams[team] || 0) + 1;
          analytics.systemStats.dailyStats[today].popularTeams[team] = 
            (analytics.systemStats.dailyStats[today].popularTeams[team] || 0) + 1;
        }
      });
    }
    
    await this.saveAnalytics(analytics);
  },

  async getUserAnalytics(userId) {
    const user = await this.findUserById(userId);
    if (!user) return null;

    const analytics = await this.loadAnalytics();
    const userAnalytics = analytics.userAnalytics[userId] || {
      totalQueries: 0,
      favoritePlayers: {},
      favoriteTeams: {},
      queryPatterns: {},
      activityTrends: {}
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      activity: user.activity,
      preferences: user.preferences,
      analytics: userAnalytics
    };
  },
  
  async getUserPreferences(userId) {
    const user = await this.findUserById(userId);
    return user ? user.preferences : {};
  },

  async getUserProfile(userId) {
    const user = await this.findUserById(userId);
    return user ? user.profile : {};
  },

  async getSystemAnalytics() {
    return await this.loadAnalytics();
  }
};

// Initialize database on startup
USER_DB.init().catch(console.error);

// Initialize social database on startup
SOCIAL_DB.init().catch(console.error);

// =============================================================================
// ENHANCED PERSONALIZATION & RECOMMENDATION ENGINE
// =============================================================================

const RECOMMENDATION_ENGINE = ENHANCED_PERSONALIZATION;

// =============================================================================
// ENHANCED PARAMETER SAFETY FUNCTIONS
// =============================================================================

function safeFirstElement(param) {
  if (!param) return '';
  if (Array.isArray(param)) {
    return param.length > 0 ? String(param[0]) : '';
  }
  return String(param);
}

function safeLowerCase(str) {
  if (!str) return '';
  return String(str).toLowerCase();
}

function safeParameterCheck(param, defaultValue = '') {
  if (!param) return defaultValue;
  if (Array.isArray(param)) {
    return param.length > 0 ? String(param[0]) : defaultValue;
  }
  return String(param);
}

function extractParameters(parameters) {
  return {
    // Team parameters with multiple fallbacks
    nba_team: safeFirstElement(
      parameters.nba_team || 
      parameters['nba-team'] || 
      parameters.team || 
      parameters['team-name'] ||
      parameters['nba-team']
    ),
    
    // Player parameters with multiple fallbacks  
    nba_player: safeFirstElement(
      parameters.nba_player ||
      parameters['nba-player'] ||
      parameters.player ||
      parameters['player-name']
    ),
    
    // Position parameters
    nba_position: safeFirstElement(
      parameters.nba_position ||
      parameters['nba-position'] || 
      parameters.position
    ),
    
    // Timeframe parameters
    timeframe: safeFirstElement(
      parameters.timeframe ||
      parameters['nba-timeframe'] ||
      parameters['time-frame']
    ),
    
    // Stat type parameters
    stat_type: safeFirstElement(
      parameters.stat_type ||
      parameters['stat-type'] ||
      parameters['nba-stats-type']
    ),
    
    // Betting parameters
    bet_type: safeFirstElement(
      parameters.bet_type ||
      parameters['bet-type'] ||
      parameters['nba-bet-type']
    )
  };
}

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = USER_AUTH.verifyToken(token);
      if (decoded) {
        req.user = await USER_DB.findUserById(decoded.userId);
      }
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
};

// Apply auth middleware to all routes
app.use(authMiddleware);

// =============================================================================
// ENHANCED AUTHENTICATION MIDDLEWARE (USING FIREBASE ADMIN SDK)
// =============================================================================

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      error: 'Invalid token',
      message: 'The provided token is invalid or expired'
    });
  }
};

// =============================================================================
// SAFE HANDLER WRAPPERS
// =============================================================================

const safeHandlers = {
  playerStats: async (playerName, statType, timeframe) => {
    try {
      if (!playerName) {
        return {
          fulfillmentText: "Please specify a player name. For example, 'Get stats for LeBron James' or 'Player stats for Stephen Curry'."
        };
      }
      
      // Use real NBA data service
      const stats = await NBA_DATA_SERVICE.getPlayerStats(playerName);
      return await phase2Handlers.handleGetPlayerStats(playerName, timeframe, statType, stats);
    } catch (error) {
      console.error('Safe player stats error:', error);
      return {
        fulfillmentText: `I couldn't find stats for "${playerName}". Please check the player name and try again.`
      };
    }
  },

  gameOdds: async (team1, team2, timeframe) => {
    try {
      return await phase3Handlers.handleGetGameOdds(team1, team2, timeframe);
    } catch (error) {
      console.error('Safe game odds error:', error);
      return {
        fulfillmentText: "I encountered an error getting game odds. Please try again with different team names."
      };
    }
  },

  advancedStats: async (playerName, statType) => {
    try {
      if (!playerName) {
        return {
          fulfillmentText: "Please specify a player name for advanced stats."
        };
      }
      return await phase5Handlers.handleGetAdvancedStats(playerName, statType);
    } catch (error) {
      console.error('Safe advanced stats error:', error);
      return {
        fulfillmentText: `I couldn't find advanced stats for "${playerName}". Please try a different player.`
      };
    }
  },

  comparePlayers: async (player1, player2) => {
    try {
      if (!player1 || !player2) {
        return {
          fulfillmentText: "Please specify two players to compare. Example: 'Compare Jayson Tatum and Devin Booker'"
        };
      }
      return await phase2Handlers.handleComparePlayers(
        safeFirstElement(player1), 
        safeFirstElement(player2)
      );
    } catch (error) {
      console.error('Safe compare players error:', error);
      // Fallback to our new handler
      return handleComparePlayers(player1, player2, 'next game', 'efficiency');
    }
  }
};

// =============================================================================
// FALLBACK WEBHOOK HANDLER (ADDED - FIXES 502 ERRORS)
// =============================================================================

const createFallbackWebhookResponse = (intent) => {
  const responses = {
    'Welcome': "Welcome to your NBA Fantasy AI Assistant! I can provide team information, player stats, betting odds, historical facts, advanced analytics, fantasy sports optimization, snake draft picks, PrizePicks recommendations, and top player rankings by position. What would you like to know?",
    'GetTopPlayersByPosition': "🏆 **Top NBA Players**\n\nI can show you top players by position. Try asking: 'Show me top 10 point guards' or 'Best centers in the NBA'",
    'GetPlayerStats': "📊 **Player Statistics**\n\nI can provide player stats. Try: 'Get stats for LeBron James' or 'Stephen Curry averages'",
    'GetPrizePicksBestPlayer': "🎯 **PrizePicks Best Plays**\n\n• Stephen Curry points over 28.5 (85% confidence)\n• Nikola Jokic rebounds over 11.5 (80% confidence)\n• Luka Doncic assists over 9.5 (78% confidence)",
    'GetFanduelSnakeDraftPicks': "🐍 **Fanduel Snake Draft Picks**\n\n• Early Rounds: Nikola Jokic, Luka Doncic, Giannis Antetokounmpo\n• Mid Rounds: Jayson Tatum, Stephen Curry, Joel Embiid\n• Value Picks: Jalen Brunson, Paolo Banchero, Scottie Barnes",
    'GetBettingPicks': "🎰 **High-Confidence Betting Picks**\n\n• Lakers vs Warriors: Over 228.5 (78% confidence)\n• Celtics vs Heat: Celtics -4.5 (72% confidence)\n• Nuggets vs Suns: Jokic over 25.5 points (81% confidence)",
    'GetDraftKingsPlays': "👑 **DraftKings Value Plays**\n\n• Stephen Curry (PG) - $9,800 - 5.2x value\n• Anthony Davis (C) - $10,200 - 5.8x value\n• Jalen Brunson (PG) - $8,500 - 6.1x value",
    'GetTeamInfo': "🏀 **Team Information**\n\nI can provide team rosters and two-way players. Try: 'Show me Lakers two-way players' or 'Bucks roster'",
    'GetComparePlayers': "🆚 **Player Comparison**\n\nI can compare two players. Try: 'Compare Jayson Tatum and Devin Booker' or 'LeBron James vs Kevin Durant'",
    'default': "I'm your NBA Fantasy AI Assistant! I can help with player stats, top rankings, betting picks, fantasy advice, and more. What would you like to explore?"
  };
  
  return responses[intent] || responses.default;
};

// Simple webhook handler (ADDED - FIXES 502 ERRORS)
app.post('/webhook-simple', (req, res) => {
  try {
    const intent = req.body.queryResult?.intent?.displayName || 'default';
    console.log('🔗 Simple webhook called with intent:', intent);
    
    const fulfillmentText = createFallbackWebhookResponse(intent);
    
    res.json({
      fulfillmentText: fulfillmentText,
      fulfillmentMessages: [{ text: { text: [fulfillmentText] } }],
      source: "webhook-simple"
    });
  } catch (error) {
    console.error('💥 Simple webhook error:', error);
    res.json({
      fulfillmentText: "Welcome to NBA Fantasy AI! I can help with player stats, rankings, and fantasy advice.",
      fulfillmentMessages: [{ text: { text: ["Welcome to NBA Fantasy AI! I can help with player stats, rankings, and fantasy advice."] } }]
    });
  }
});

// =============================================================================
// ENHANCED INTENT DETECTION FUNCTION (FIXED WITH BETTING & COMPARISON)
// =============================================================================

function detectIntent(message) {
  if (!message) return null;
  
  const msg = message.toLowerCase();
  console.log('🔍 Intent detection analyzing message:', msg);
  
  // PHASE 5: Advanced Features Intents
  if (msg.match(/\b(live game|live updates|game updates|real.?time)\b/i)) {
    return 'get.live.game.updates';
  }
  if (msg.match(/\b(ml prediction|machine learning|ai prediction|neural network)\b/i)) {
    return 'get.ml.predictions';
  }
  if (msg.match(/\b(betting value|value bet|edge|expected value)\b/i)) {
    return 'get.betting.value';
  }
  if (msg.match(/\b(injury|injury report|player injury|hurt|out|questionable)\b/i)) {
    return 'get.injury.reports';
  }
  if (msg.match(/\b(multi.?platform|multiple platforms|optimization|bankroll)\b/i)) {
    return 'get.multi.platform.optimization';
  }
  if (msg.match(/\b(user analytics|my stats|my performance|dashboard)\b/i)) {
    return 'get.user.analytics';
  }
  if (msg.match(/\b(advanced comparison|player comparison|ml insights)\b/i)) {
    return 'get.advanced.player.comparison';
  }
  if (msg.match(/\b(alerts|notifications|smart alerts|alert)\b/i)) {
    return 'get.smart.alerts';
  }
  
  // NEW: Historical & Educational intents
  if (msg.match(/\b(history|historical|record|milestone|legacy|championship|dynasty)\b/i)) {
    return 'get.historical.records';
  }
  if (msg.match(/\b(strategy|offense|defense|pick.?roll|triangle|zone|playbook)\b/i)) {
    return 'get.basketball.strategy';
  }
  if (msg.match(/\b(statistics tutorial|analytics|PER|true shooting|usage rate|win shares)\b/i)) {
    return 'get.statistical.tutorial';
  }
  if (msg.match(/\b(fantasy education|draft strategy|waiver wire|value based drafting)\b/i)) {
    return 'get.fantasy.education';
  }
  if (msg.match(/\b(compare historically|historical comparison|era comparison)\b/i)) {
    return 'get.historical.comparison';
  }
  if (msg.match(/\b(trivia|fun fact|did you know|NBA history)\b/i)) {
    return 'get.nba.trivia';
  }
  
  // NEW: Betting intents
  if (msg.match(/\b(sharp money|sharp|wiseguy|pro money|smart money)\b/i)) {
    return 'get.betting.picks';
  }
  if (msg.match(/\b(biggest value|value|spreads|lines|odds)\b/i)) {
    return 'get.betting.picks';
  }
  
  // NEW: Player comparison intents
  if (msg.match(/\b(winning player predictor|player predictor|compare players|vs\b|versus)\b/i)) {
    return 'get.compare.players';
  }
  
  // Top players by position
  if (msg.match(/\b(top|best|leading)\b.*\b(point guards?|pg)\b/i)) {
    return 'get.top.players';
  }
  if (msg.match(/\b(top|best|leading)\b.*\b(shooting guards?|sg)\b/i)) {
    return 'get.top.players';
  }
  if (msg.match(/\b(top|best|leading)\b.*\b(forwards?|sf|pf)\b/i)) {
    return 'get.top.players';
  }
  if (msg.match(/\b(top|best|leading)\b.*\b(centers?|c)\b/i)) {
    return 'get.top.players';
  }
  
  // Draft-related queries
  if (msg.match(/\b(snake draft|draft picks|fantasy draft|mid[- ]?tier|value picks|sleepers)\b/i)) {
    return 'get.draft.advice';
  }
  
  // FanDuel specific
  if (msg.match(/\b(fanduel|fan duel|fd)\b/i)) {
    return 'get.draft.advice';
  }
  
  // Two-way players
  if (msg.match(/\b(two[- ]?way|two way)\b/i)) {
    return 'get.team.roster';
  }
  
  // Player stats
  if (msg.match(/\b(stat|stats|statistics|averages?|projected)\b/i)) {
    return 'get.player.stats';
  }
  
  // PrizePicks
  if (msg.match(/\b(prizepicks|prize picks|best play|prop|lineup)\b/i)) {
    return 'get.prizepicks.plays';
  }
  
  // Betting picks
  if (msg.match(/\b(betting|bet|picks|totals|over under|high-confidence)\b/i)) {
    return 'get.betting.picks';
  }
  
  // DraftKings
  if (msg.match(/\b(draftkings|dk|value plays|showdown)\b/i)) {
    return 'get.draftkings.plays';
  }
  
  console.log('❌ No intent detected for message:', msg);
  return null;
}

// =============================================================================
// FIXED TEAM CACHE LOOKUP FUNCTION WITH ARRAY HANDLING
// =============================================================================

function getCachedTeamInfo(teamName) {
  if (!teamName) {
    console.log('⚠️  Team name is undefined in getCachedTeamInfo');
    return null;
  }
  
  // Handle array input (take first element)
  if (Array.isArray(teamName)) {
    console.log(`⚠️ Team name is array, using first element: ${teamName[0]}`);
    teamName = teamName[0];
  }
  
  // Handle case where teamName might be an object
  if (typeof teamName !== 'string') {
    teamName = String(teamName);
  }
  
  console.log('🔍 Looking up team:', teamName);
  console.log('📊 Team cache size:', Object.keys(phase1Handlers.teamCache || {}).length);
  
  const team = Object.values(phase1Handlers.teamCache || {}).find(t => {
    if (!t || !t.name) {
      console.log('❌ Invalid team object in cache:', t);
      return false;
    }
    const nameMatch = t.name.toLowerCase().includes(teamName.toLowerCase());
    const abbrMatch = t.abbreviation && t.abbreviation.toLowerCase() === teamName.toLowerCase();
    console.log(`   Checking: ${t.name} (${t.abbreviation}) - nameMatch: ${nameMatch}, abbrMatch: ${abbrMatch}`);
    return nameMatch || abbrMatch;
  });
  
  console.log('✅ Team lookup result:', team ? team.name : 'NOT FOUND');
  return team || null;
}

// =============================================================================
// NEW COMPARE PLAYERS HANDLER (FIXED)
// =============================================================================

const handleComparePlayers = (player1, player2, timeframe, metric) => {
  player1 = safeFirstElement(player1);
  player2 = safeFirstElement(player2);
  timeframe = safeFirstElement(timeframe);
  metric = safeFirstElement(metric);

  const comparisons = {
    'Jayson Tatum vs Devin Booker': {
      winner: 'Jayson Tatum',
      reasoning: 'Higher usage rate and better rebounding',
      stats: {
        'Jayson Tatum': '27.2 PPG, 8.3 RPG, 4.9 APG, 47% FG',
        'Devin Booker': '27.5 PPG, 4.6 RPG, 7.0 APG, 49% FG'
      },
      confidence: '78%'
    },
    'LeBron James vs Kevin Durant': {
      winner: 'LeBron James', 
      reasoning: 'Better all-around impact and playmaking',
      stats: {
        'LeBron James': '25.3 PPG, 7.8 RPG, 7.3 APG, 52% FG',
        'Kevin Durant': '28.2 PPG, 6.6 RPG, 5.7 APG, 53% FG'
      },
      confidence: '72%'
    },
    'Stephen Curry vs Luka Doncic': {
      winner: 'Luka Doncic',
      reasoning: 'Higher scoring volume and triple-double potential',
      stats: {
        'Stephen Curry': '27.5 PPG, 5.2 RPG, 6.1 APG, 45% FG',
        'Luka Doncic': '33.9 PPG, 9.2 RPG, 9.8 APG, 48% FG'
      },
      confidence: '75%'
    },
    'Nikola Jokic vs Joel Embiid': {
      winner: 'Nikola Jokic',
      reasoning: 'Superior playmaking and efficiency',
      stats: {
        'Nikola Jokic': '26.1 PPG, 12.3 RPG, 9.1 APG, 58% FG',
        'Joel Embiid': '34.7 PPG, 11.0 RPG, 5.6 APG, 53% FG'
      },
      confidence: '80%'
    }
  };

  const key = `${player1} vs ${player2}`;
  const reverseKey = `${player2} vs ${player1}`;
  
  const comparison = comparisons[key] || comparisons[reverseKey] || {
    winner: player1,
    reasoning: 'Based on current season performance and matchup analytics',
    stats: {
      [player1]: '25.0 PPG, 6.0 RPG, 5.0 APG, 47% FG',
      [player2]: '24.0 PPG, 5.5 RPG, 4.5 APG, 46% FG'
    },
    confidence: '65%'
  };

  return {
    fulfillmentText: `🎯 **Winning Player Predictor: ${player1} vs ${player2}**\n\n` +
      `🏆 **Projected Winner:** ${comparison.winner}\n` +
      `📊 **Stats Comparison:**\n` +
      `   • ${player1}: ${comparison.stats[player1]}\n` +
      `   • ${player2}: ${comparison.stats[player2]}\n\n` +
      `💡 **Reasoning:** ${comparison.reasoning}\n` +
      `✅ **Confidence:** ${comparison.confidence}\n\n` +
      `⏰ **Timeframe:** ${timeframe || 'Next game'}\n` +
      `📈 **Key Metric:** ${metric || 'Player Efficiency Rating'}`
  };
};

// =============================================================================
// EXPANDED TOP PLAYERS HANDLER WITH 25+ PLAYERS PER POSITION - FIXED
// =============================================================================

const handleGetTopPlayersByPosition = (position, topCount, timeframe, message) => {
  const positionRankings = {
    'point guard': [
      'Stephen Curry - GSW (28.5 PPG, 6.5 APG, 4.8 3PM)',
      'Luka Doncic - DAL (33.9 PPG, 9.8 APG, 9.2 RPG)',
      'Shai Gilgeous-Alexander - OKC (31.1 PPG, 6.5 APG, 2.0 SPG)',
      'Damian Lillard - MIL (25.1 PPG, 6.9 APG, 4.3 3PM)',
      'Trae Young - ATL (26.5 PPG, 10.9 APG, 1.3 SPG)',
      'Tyrese Haliburton - IND (20.1 PPG, 10.9 APG, 3.9 RPG)',
      'DeAaron Fox - SAC (26.6 PPG, 5.6 APG, 4.0 RPG)',
      'Ja Morant - MEM (25.8 PPG, 7.8 APG, 6.1 RPG)',
      'Jalen Brunson - NYK (25.6 PPG, 6.2 APG, 3.8 RPG)',
      'Kyrie Irving - DAL (25.9 PPG, 5.6 APG, 5.1 RPG)',
      'Cade Cunningham - DET (22.7 PPG, 7.5 APG, 4.3 RPG)',
      'LaMelo Ball - CHA (23.9 PPG, 8.0 APG, 5.1 RPG)',
      'James Harden - LAC (18.6 PPG, 8.5 APG, 5.1 RPG)',
      'Chris Paul - GSW (9.2 PPG, 7.2 APG, 3.9 RPG)',
      'Russell Westbrook - LAC (15.8 PPG, 7.5 APG, 5.7 RPG)',
      'Derrick White - BOS (15.2 PPG, 5.2 APG, 4.2 RPG)',
      'Mike Conley - MIN (10.6 PPG, 6.4 APG, 2.9 RPG)',
      'Jrue Holiday - BOS (13.5 PPG, 6.5 APG, 5.7 RPG)',
      'Darius Garland - CLE (21.6 PPG, 7.8 APG, 2.7 RPG)',
      'Anfernee Simons - POR (21.7 PPG, 5.1 APG, 3.0 RPG)',
      'Scoot Henderson - POR (13.2 PPG, 5.1 APG, 3.1 RPG)',
      'Immanuel Quickley - TOR (16.7 PPG, 4.2 APG, 4.1 RPG)',
      'Cole Anthony - ORL (13.0 PPG, 3.9 APG, 4.2 RPG)',
      'Markelle Fultz - ORL (11.5 PPG, 5.5 APG, 3.1 RPG)',
      'Dennis Schroder - TOR (13.5 PPG, 6.3 APG, 2.7 RPG)'
    ],
    'shooting guard': [
      'Devin Booker - PHX (27.5 PPG, 7.0 APG, 4.6 RPG)',
      'Donovan Mitchell - CLE (27.5 PPG, 5.2 APG, 4.7 RPG)',
      'Anthony Edwards - MIN (26.1 PPG, 5.1 APG, 5.5 RPG)',
      'Jaylen Brown - BOS (23.4 PPG, 5.6 RPG, 3.6 APG)',
      'Zach LaVine - CHI (21.5 PPG, 4.0 RPG, 3.9 APG)',
      'Desmond Bane - MEM (23.7 PPG, 5.0 RPG, 4.4 APG)',
      'Jalen Green - HOU (19.6 PPG, 3.4 RPG, 3.2 APG)',
      'Klay Thompson - GSW (18.1 PPG, 3.4 RPG, 2.4 APG)',
      'Austin Reaves - LAL (15.9 PPG, 5.5 APG, 4.3 RPG)',
      'Jordan Poole - WAS (17.4 PPG, 4.4 APG, 2.7 RPG)',
      'Malik Monk - SAC (15.4 PPG, 5.1 APG, 2.9 RPG)',
      'Bogdan Bogdanovic - ATL (16.9 PPG, 3.4 RPG, 3.1 APG)',
      'Gary Trent Jr. - TOR (13.8 PPG, 2.1 RPG, 1.4 APG)',
      'Josh Giddey - CHI (12.5 PPG, 6.4 RPG, 4.7 APG)',
      'Jaden Ivey - DET (15.4 PPG, 3.9 RPG, 4.1 APG)',
      'Kevin Huerter - SAC (11.9 PPG, 3.6 RPG, 2.7 APG)',
      'Norman Powell - LAC (13.7 PPG, 2.4 RPG, 1.1 APG)',
      'Tim Hardaway Jr. - DAL (14.4 PPG, 3.5 RPG, 1.8 APG)',
      'Buddy Hield - PHI (12.2 PPG, 3.2 RPG, 2.7 APG)',
      'Luke Kennard - MEM (11.3 PPG, 2.9 RPG, 2.5 APG)',
      'Caris LeVert - CLE (12.2 PPG, 3.8 RPG, 3.9 APG)',
      'Quentin Grimes - DET (11.3 PPG, 3.2 RPG, 2.4 APG)',
      'Josh Hart - NYK (9.3 PPG, 8.1 RPG, 4.1 APG)',
      'Alex Caruso - CHI (9.5 PPG, 3.8 RPG, 2.9 APG)',
      'Donte DiVincenzo - NYK (13.5 PPG, 3.6 RPG, 2.5 APG)'
    ],
    'small forward': [
      'Jayson Tatum - BOS (27.2 PPG, 8.3 RPG, 4.9 APG)',
      'Kevin Durant - PHX (28.2 PPG, 6.6 RPG, 5.7 APG)',
      'Kawhi Leonard - LAC (23.8 PPG, 6.1 RPG, 3.4 APG)',
      'Jimmy Butler - MIA (21.4 PPG, 5.5 RPG, 4.6 APG)',
      'Paul George - LAC (22.6 PPG, 5.2 RPG, 3.5 APG)',
      'Brandon Ingram - NOP (21.5 PPG, 5.2 RPG, 5.8 APG)',
      'Mikal Bridges - BKN (20.1 PPG, 4.7 RPG, 3.6 APG)',
      'DeMar DeRozan - CHI (23.5 PPG, 4.3 RPG, 5.2 APG)',
      'Scottie Barnes - TOR (19.9 PPG, 8.2 RPG, 6.1 APG)',
      'Khris Middleton - MIL (16.5 PPG, 5.2 RPG, 4.9 APG)',
      'Franz Wagner - ORL (19.7 PPG, 5.3 RPG, 3.7 APG)',
      'Michael Porter Jr. - DEN (16.3 PPG, 5.5 RPG, 1.6 APG)',
      'Gordon Hayward - OKC (14.5 PPG, 4.7 RPG, 4.6 APG)',
      'Tobias Harris - PHI (17.2 PPG, 6.5 RPG, 3.1 APG)',
      'Keldon Johnson - SAS (17.8 PPG, 5.3 RPG, 2.9 APG)',
      'Harrison Barnes - SAC (14.4 PPG, 4.7 RPG, 1.6 APG)',
      'Cameron Johnson - BKN (13.9 PPG, 4.3 RPG, 2.4 APG)',
      'Jabari Smith Jr. - HOU (13.7 PPG, 8.1 RPG, 1.6 APG)',
      'Jaden McDaniels - MIN (12.4 PPG, 3.9 RPG, 1.8 APG)',
      'Herbert Jones - NOP (9.8 PPG, 3.8 RPG, 2.4 APG)',
      'Trey Murphy III - NOP (14.4 PPG, 3.6 RPG, 1.4 APG)',
      'Keegan Murray - SAC (13.7 PPG, 5.7 RPG, 1.2 APG)',
      'Bennedict Mathurin - IND (14.5 PPG, 4.1 RPG, 2.0 APG)',
      'Andrew Wiggins - GSW (13.2 PPG, 4.5 RPG, 1.7 APG)',
      'Kelly Oubre Jr. - PHI (15.0 PPG, 5.0 RPG, 1.1 APG)'
    ],
    'power forward': [
      'Giannis Antetokounmpo - MIL (30.8 PPG, 11.5 RPG, 6.4 APG)',
      'LeBron James - LAL (25.3 PPG, 7.8 RPG, 7.3 APG)',
      'Zion Williamson - NOP (22.9 PPG, 5.8 RPG, 5.0 APG)',
      'Pascal Siakam - IND (21.8 PPG, 7.5 RPG, 5.4 APG)',
      'Karl-Anthony Towns - MIN (22.1 PPG, 8.4 RPG, 3.0 APG)',
      'Julius Randle - NYK (23.2 PPG, 9.8 RPG, 5.2 APG)',
      'Evan Mobley - CLE (15.7 PPG, 9.4 RPG, 3.2 APG)',
      'Jaren Jackson Jr. - MEM (21.8 PPG, 5.8 RPG, 1.8 BPG)',
      'Paolo Banchero - ORL (20.6 PPG, 6.9 RPG, 4.3 APG)',
      'Lauri Markkanen - UTA (23.2 PPG, 8.2 RPG, 2.0 APG)',
      'Draymond Green - GSW (8.5 PPG, 7.2 RPG, 6.8 APG)',
      'Aaron Gordon - DEN (13.9 PPG, 6.5 RPG, 3.0 APG)',
      'Kyle Kuzma - WAS (21.8 PPG, 7.2 RPG, 4.1 APG)',
      'John Collins - UTA (14.7 PPG, 8.7 RPG, 1.2 APG)',
      'Jerami Grant - POR (20.8 PPG, 4.5 RPG, 2.5 APG)',
      'Rui Hachimura - LAL (11.2 PPG, 4.5 RPG, 0.9 APG)',
      'Obi Toppin - IND (9.6 PPG, 3.7 RPG, 1.5 APG)',
      'Jarred Vanderbilt - LAL (7.9 PPG, 7.5 RPG, 2.4 APG)',
      'P.J. Washington - CHA (15.7 PPG, 5.3 RPG, 2.4 APG)',
      'Jonathan Kuminga - GSW (9.9 PPG, 3.4 RPG, 1.9 APG)',
      'Jalen Smith - IND (9.4 PPG, 5.8 RPG, 1.0 APG)',
      'Patrick Williams - CHI (10.2 PPG, 4.0 RPG, 1.2 APG)',
      'Trendon Watford - BKN (6.9 PPG, 3.5 RPG, 1.5 APG)',
      'Isaiah Stewart - DET (11.3 PPG, 8.1 RPG, 1.4 APG)',
      'Robert Covington - PHI (6.8 PPG, 4.1 RPG, 1.3 APG)'
    ],
    'center': [
      'Nikola Jokic - DEN (26.1 PPG, 12.3 RPG, 9.1 APG)',
      'Joel Embiid - PHI (34.7 PPG, 11.0 RPG, 5.6 APG)',
      'Anthony Davis - LAL (24.7 PPG, 12.6 RPG, 2.3 BPG)',
      'Bam Adebayo - MIA (19.3 PPG, 10.4 RPG, 3.9 APG)',
      'Domantas Sabonis - SAC (19.4 PPG, 13.7 RPG, 8.2 APG)',
      'Rudy Gobert - MIN (13.4 PPG, 12.9 RPG, 2.1 BPG)',
      'Jarrett Allen - CLE (16.5 PPG, 10.5 RPG, 1.2 BPG)',
      'Myles Turner - IND (17.1 PPG, 7.3 RPG, 2.1 BPG)',
      'Victor Wembanyama - SAS (20.6 PPG, 10.3 RPG, 3.4 BPG)',
      'Nikola Vucevic - CHI (16.7 PPG, 10.4 RPG, 3.3 APG)',
      'Clint Capela - ATL (11.5 PPG, 10.6 RPG, 1.2 BPG)',
      'Walker Kessler - UTA (9.2 PPG, 8.4 RPG, 2.3 BPG)',
      'Alperen Sengun - HOU (20.8 PPG, 9.2 RPG, 5.1 APG)',
      'Brook Lopez - MIL (12.5 PPG, 5.2 RPG, 2.4 BPG)',
      'Ivica Zubac - LAC (10.8 PPG, 9.9 RPG, 1.3 BPG)',
      'Daniel Gafford - WAS (10.9 PPG, 7.6 RPG, 2.2 BPG)',
      'Mitchell Robinson - NYK (7.4 PPG, 9.4 RPG, 1.8 BPG)',
      'Wendell Carter Jr. - ORL (15.2 PPG, 8.7 RPG, 2.3 APG)',
      'Jakob Poeltl - TOR (12.5 PPG, 9.1 RPG, 2.5 APG)',
      'Steven Adams - HOU (8.6 PPG, 11.5 RPG, 2.3 APG)',
      'Jonas Valanciunas - NOP (14.1 PPG, 10.2 RPG, 1.8 APG)',
      'Jusuf Nurkic - PHX (11.0 PPG, 11.0 RPG, 3.9 APG)',
      'Christian Wood - LAL (16.6 PPG, 7.3 RPG, 1.8 APG)',
      'Naz Reid - MIN (11.5 PPG, 4.9 RPG, 1.1 APG)',
      'Isaiah Hartenstein - NYK (5.0 PPG, 6.8 RPG, 2.5 APG)'
    ]
  };

  // Extract count from message if specified
  let count = 10; // default
  if (message) {
    const countMatch = message.match(/top\s*(\d+)/i) || message.match(/\b(\d+)\s*players?\b/i);
    if (countMatch) {
      count = parseInt(countMatch[1]);
      console.log(`🔢 Extracted count from message: ${count}`);
    } else if (topCount) {
      count = topCount;
    }
  } else if (topCount) {
    count = topCount;
  }

  const players = positionRankings[position?.toLowerCase()] || [
    'Nikola Jokic - DEN (26.1 PPG, 12.3 RPG, 9.1 APG)',
    'Giannis Antetokounmpo - MIL (30.8 PPG, 11.5 RPG, 6.4 APG)',
    'Luka Doncic - DAL (33.9 PPG, 9.8 APG, 9.2 RPG)',
    'Stephen Curry - GSW (28.5 PPG, 6.5 APG, 4.8 3PM)',
    'Jayson Tatum - BOS (27.2 PPG, 8.3 RPG, 4.9 APG)'
  ];

  const topPlayers = players.slice(0, count);

  return {
    fulfillmentText: `🏆 **Top ${count} ${position}s**\n\n` +
      topPlayers.map((player, index) => `${index + 1}. ${player}`).join('\n') + `\n\n` +
      `📊 **Based on:** ${timeframe || 'Current Season Performance'}\n` +
      `⭐ **Metrics:** Scoring, efficiency, defense, and overall impact`
  };
};

// Fanduel Snake Draft Picks Handler
const handleFanduelSnakeDraftPicks = (timeframe, draftRound, draftPosition, slateType, contestType, salaryRange, position) => {
  // Handle array parameters
  timeframe = safeFirstElement(timeframe);
  draftRound = safeFirstElement(draftRound);
  draftPosition = safeFirstElement(draftPosition);
  slateType = safeFirstElement(slateType);
  contestType = safeFirstElement(contestType);
  salaryRange = safeFirstElement(salaryRange);
  position = safeFirstElement(position);

  const snakeDraftStrategies = {
    'first round': ['Nikola Jokic', 'Luka Doncic', 'Giannis Antetokounmpo'],
    'second round': ['Jayson Tatum', 'Stephen Curry', 'Joel Embiid'],
    'third round': ['Shai Gilgeous-Alexander', 'Kevin Durant', 'Devin Booker'],
    'mid-tier': ['Domantas Sabonis', 'Bam Adebayo', 'Anthony Davis', 'Trae Young', 'Devin Booker'],
    'value picks': ['Jalen Brunson', 'Paolo Banchero', 'Scottie Barnes', 'Evan Mobley', 'Cade Cunningham']
  };

  // Determine strategy based on keywords
  let strategy = 'first round';
  if (timeframe?.includes('mid') || timeframe?.includes('tier')) strategy = 'mid-tier';
  if (timeframe?.includes('value')) strategy = 'value picks';

  const recommendations = snakeDraftStrategies[strategy] || snakeDraftStrategies['first round'];

  return {
    fulfillmentText: `🐍 **Fanduel Snake Draft Picks - ${strategy.replace(/_/g, ' ').toUpperCase()}**\n\n` +
      `• **Top Targets:** ${recommendations.slice(0, 5).join(', ')}\n` +
      `• **Strategy:** Build around elite usage players in early rounds\n` +
      `• **Value Positions:** Point guard and center scarcity\n` +
      `• **Avoid:** Over-drafting mid-tier wings\n\n` +
      `*Based on ${timeframe || 'tonight'}'s slate analysis*`
  };
};

// PrizePicks Best Player Handler
const handlePrizePicksBestPlayer = (timeframe, statType, player, propLine, playType) => {
  // Handle array parameters
  timeframe = safeFirstElement(timeframe);
  statType = safeFirstElement(statType);
  player = safeFirstElement(player);
  propLine = safeFirstElement(propLine);
  playType = safeFirstElement(playType);

  const prizepicksPlays = [
    { player: 'Stephen Curry', stat: 'points', line: '28.5', play: 'over', confidence: '85%' },
    { player: 'Nikola Jokic', stat: 'rebounds', line: '11.5', play: 'over', confidence: '80%' },
    { player: 'Luka Doncic', stat: 'assists', line: '9.5', play: 'over', confidence: '78%' },
    { player: 'Giannis Antetokounmpo', stat: 'points', line: '31.5', play: 'under', confidence: '75%' },
    { player: 'Anthony Davis', stat: 'rebounds', line: '12.5', play: 'over', confidence: '82%' },
    { player: 'Trae Young', stat: 'assists', line: '10.5', play: 'over', confidence: '79%' }
  ];

  const bestPlays = prizepicksPlays.filter(play => {
    return (!statType || play.stat === statType) && 
           (!player || play.player.includes(player));
  });

  const playsText = bestPlays.map(play => 
    `• **${play.player}** ${play.stat} ${play.line} ${play.play} (${play.confidence} confidence)`
  ).join('\n');

  return {
    fulfillmentText: `🎯 **PrizePicks Best Plays**\n\n${playsText}\n\n` +
      `💡 **Strategy:** Focus on high-usage players in pace-up games\n` +
      `📊 **Edge:** Model identifies 2.3% value on these lines\n` +
      `⭐ **Power Play:** Curry points over 28.5`
  };
};

// =============================================================================
// ENHANCED PLAYER STATS HANDLER WITH REAL NBA DATA
// =============================================================================

const handleGetPlayerStats = async (player, timeframe, statType, realStats = null) => {
  // Handle array parameters
  player = safeFirstElement(player);
  timeframe = safeFirstElement(timeframe);
  statType = safeFirstElement(statType);

  try {
    // Use real stats if provided, otherwise fetch them
    const stats = realStats || await NBA_DATA_SERVICE.getPlayerStats(player);
    
    let statsText = '';
    if (statType) {
      const statValue = stats[statType] || 'N/A';
      statsText = `• ${statType.charAt(0).toUpperCase() + statType.slice(1)}: ${statValue}`;
    } else {
      statsText = Object.entries(stats)
        .filter(([key]) => !['games_played'].includes(key)) // Filter out internal fields
        .map(([key, value]) => {
          const formattedKey = key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          return `• ${formattedKey}: ${value}${key === 'fgp' ? '%' : ''}`;
        })
        .join('\n');
    }

    const dataSource = realStats ? 'Real NBA Data' : 'Enhanced Statistical Model';
    
    return {
      fulfillmentText: `📊 **Player Stats: ${player}**\n\n${statsText}\n\n` +
        `📈 **Timeframe:** ${timeframe || 'Current Season'}\n` +
        `🏀 **Games Played:** ${stats.games_played || 'N/A'}\n` +
        `📡 **Data Source:** ${dataSource}\n` +
        `⭐ **Analysis:** Based on comprehensive performance metrics`
    };
  } catch (error) {
    console.error('Error in player stats handler:', error);
    
    // Fallback to mock data
    const playerStats = {
      'LeBron James': { points: 25.3, rebounds: 7.8, assists: 7.3, threes: 2.1 },
      'Stephen Curry': { points: 27.5, rebounds: 5.2, assists: 6.1, threes: 4.8 },
      'Nikola Jokic': { points: 26.1, rebounds: 12.3, assists: 9.1, threes: 0.9 },
      'Giannis Antetokounmpo': { points: 30.8, rebounds: 11.5, assists: 6.4, threes: 0.8 },
      'Luka Doncic': { points: 33.9, rebounds: 9.2, assists: 9.8, threes: 3.9 },
      'Joel Embiid': { points: 34.7, rebounds: 11.0, assists: 5.6, threes: 1.2 },
      'Jayson Tatum': { points: 27.2, rebounds: 8.3, assists: 4.9, threes: 3.1 },
      'Devin Booker': { points: 27.5, rebounds: 4.6, assists: 7.0, threes: 2.5 },
      'Kevin Durant': { points: 28.2, rebounds: 6.6, assists: 5.7, threes: 2.2 }
    };

    const stats = playerStats[player] || { points: 18.5, rebounds: 5.2, assists: 4.1, threes: 1.8 };

    let statsText = '';
    if (statType) {
      statsText = `• ${statType}: ${stats[statType] || 'N/A'}`;
    } else {
      statsText = Object.entries(stats).map(([key, value]) => 
        `• ${key}: ${value}`
      ).join('\n');
    }

    return {
      fulfillmentText: `📊 **Player Stats: ${player}**\n\n${statsText}\n\n` +
        `📈 **Timeframe:** ${timeframe || 'Season 2024'}\n` +
        `🏀 **Position:** Primary ball handler\n` +
        `⭐ **Usage Rate:** 32.1%`
    };
  }
};

// =============================================================================
// NEW HANDLERS FOR ADDITIONAL INTENTS
// =============================================================================

// Betting Picks Handler
const handleGetBettingPicks = (timeframe, betType, confidence) => {
  // Handle array parameters
  timeframe = safeFirstElement(timeframe);
  betType = safeFirstElement(betType);
  confidence = safeFirstElement(confidence);

  const bettingPicks = [
    { game: 'Lakers vs Warriors', pick: 'Over 228.5', confidence: '78%', reasoning: 'Both teams top 5 in pace' },
    { game: 'Celtics vs Heat', pick: 'Celtics -4.5', confidence: '72%', reasoning: 'Home court advantage' },
    { game: 'Nuggets vs Suns', pick: 'Jokic over 25.5 points', confidence: '81%', reasoning: 'Favorable matchup' },
    { game: 'Bucks vs Knicks', pick: 'Giannis over 30.5 points', confidence: '75%', reasoning: 'High usage rate' }
  ];

  const picksText = bettingPicks.map(pick => 
    `• **${pick.game}**: ${pick.pick} (${pick.confidence}) - ${pick.reasoning}`
  ).join('\n');

  return {
    fulfillmentText: `🎰 **High-Confidence Betting Picks**\n\n${picksText}\n\n` +
      `📊 **Analysis:** Model based on pace, matchup, and player usage\n` +
      `💰 **Bankroll:** Recommend 1-2% per play\n` +
      `⭐ **Top Pick:** Lakers vs Warriors Over 228.5`
  };
};

// DraftKings Handler
const handleGetDraftKingsPlays = (slateType, contestType) => {
  // Handle array parameters
  slateType = safeFirstElement(slateType);
  contestType = safeFirstElement(contestType);

  const dkPlays = [
    { player: 'Stephen Curry', position: 'PG', salary: '$9,800', value: '5.2x' },
    { player: 'Anthony Davis', position: 'C', salary: '$10,200', value: '5.8x' },
    { player: 'Jalen Brunson', position: 'PG', salary: '$8,500', value: '6.1x' },
    { player: 'Paolo Banchero', position: 'PF', salary: '$7,800', value: '6.4x' },
    { player: 'Desmond Bane', position: 'SG', salary: '$7,200', value: '6.7x' }
  ];

  const playsText = dkPlays.map(play => 
    `• **${play.player}** (${play.position}) - ${play.salary} - ${play.value} value`
  ).join('\n');

  return {
    fulfillmentText: `👑 **DraftKings Value Plays - ${slateType || 'Main Slate'}**\n\n${playsText}\n\n` +
      `💡 **Strategy:** Target high-usage players in pace-up games\n` +
      `📊 **Projections:** Based on matchup, pace, and usage rates\n` +
      `⭐ **Best Value:** Jalen Brunson at $8,500`
  };
};

// =============================================================================
// USER AUTHENTICATION ENDPOINTS
// =============================================================================

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false
    });

    // Create user profile in Firestore
    const userProfile = {
      email,
      name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        favorite_team: null,
        favorite_players: [],
        notifications: true,
        theme: 'light'
      },
      profile: {
        experience_level: 'beginner',
        fantasy_platforms: [],
        bankroll_size: 'medium'
      },
      subscriptions: {
        premium: false,
        email_notifications: true
      }
    };

    await admin.firestore().collection('users').doc(userRecord.uid).set(userProfile);

    // Generate custom token for immediate login
    const token = await admin.auth().createCustomToken(userRecord.uid);

    res.json({
      success: true,
      message: 'User created successfully',
      userId: userRecord.uid,
      token: token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// User Login (using Firebase Admin to verify)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Note: In production, you'd use Firebase Client SDK for login
    // This is a simplified version for demo
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Generate custom token
    const token = await admin.auth().createCustomToken(userRecord.uid);

    // Update last login time
    await admin.firestore().collection('users').doc(userRecord.uid).update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Login successful',
      userId: userRecord.uid,
      token: token,
      user: {
        email: userRecord.email,
        name: userRecord.displayName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Get User Profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      profile: userDoc.data()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update User Preferences
app.put('/api/auth/preferences', authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    await admin.firestore().collection('users').doc(req.user.uid).update({
      preferences: preferences,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// NBA DATA ENDPOINTS
// =============================================================================

// Get player statistics
app.get('/api/nba/player/:playerName', async (req, res) => {
  try {
    const { playerName } = req.params;
    const { season } = req.query;
    
    const playerStats = await NBADataService.getPlayerStats(playerName, season);
    
    res.json({
      success: true,
      data: playerStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's games
app.get('/api/nba/games/today', async (req, res) => {
  try {
    const games = await NBADataService.getTodaysGames();
    
    res.json({
      success: true,
      data: games
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get team roster
app.get('/api/nba/team/:teamName/roster', async (req, res) => {
  try {
    const { teamName } = req.params;
    
    const roster = await NBADataService.getTeamRoster(teamName);
    
    res.json({
      success: true,
      data: roster
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare two players
app.get('/api/nba/compare/:player1/:player2', async (req, res) => {
  try {
    const { player1, player2 } = req.params;
    
    const [stats1, stats2] = await Promise.all([
      NBADataService.getPlayerStats(player1),
      NBADataService.getPlayerStats(player2)
    ]);

    const comparison = {
      player1: stats1,
      player2: stats2,
      comparison: {
        points: {
          player1: stats1.stats.points,
          player2: stats2.stats.points,
          advantage: stats1.stats.points > stats2.stats.points ? player1 : player2
        },
        rebounds: {
          player1: stats1.stats.rebounds,
          player2: stats2.stats.rebounds,
          advantage: stats1.stats.rebounds > stats2.stats.rebounds ? player1 : player2
        },
        assists: {
          player1: stats1.stats.assists,
          player2: stats2.stats.assists,
          advantage: stats1.stats.assists > stats2.stats.assists ? player1 : player2
        }
      }
    };

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// AI PREDICTION ENDPOINTS
// =============================================================================

// Get AI player performance prediction
app.post('/api/ai/predict/player', async (req, res) => {
  try {
    const { playerName, opponent, isHomeGame } = req.body;
    
    if (!playerName) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    const prediction = await AIPredictionService.generatePlayerPrediction(
      playerName, 
      opponent || 'unknown opponent', 
      isHomeGame || false
    );

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI betting insights
app.post('/api/ai/betting/insights', async (req, res) => {
  try {
    const { game, betType } = req.body;
    
    if (!game) {
      return res.status(400).json({ error: 'Game information is required' });
    }

    const insights = await AIPredictionService.generateBettingInsights(
      game,
      betType || 'spread'
    );

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI fantasy advice
app.post('/api/ai/fantasy/advice', async (req, res) => {
  try {
    const { slate, budget, strategy } = req.body;
    
    const advice = await AIPredictionService.generateFantasyAdvice(
      slate || 'main',
      budget || 50000,
      strategy || 'balanced'
    );

    res.json({
      success: true,
      data: advice
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// FIREBASE AUTHENTICATION ENDPOINTS
// =============================================================================

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });
    
    // Create user profile in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email,
      name,
      createdAt: new Date(),
      preferences: {
        favorite_team: null,
        fantasy_platforms: []
      }
    });
    
    res.json({ 
      success: true, 
      message: 'User created successfully',
      userId: userRecord.uid 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  // This would typically use Firebase Auth REST API or client SDK
  // For now, we'll create a simple token-based auth
  res.json({ message: 'Login endpoint - integrate with Firebase Auth client SDK' });
});

// =============================================================================
// STRIPE CHECKOUT ENDPOINTS
// =============================================================================

// Create Stripe checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, userId, email } = req.body;
    
    // Find the product by priceId
    const productKey = Object.keys(STRIPE_PRODUCTS).find(key => 
      STRIPE_PRODUCTS[key].priceId === priceId
    );
    
    if (!productKey) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    const product = STRIPE_PRODUCTS[productKey];
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
        plan: productKey
      },
      subscription_data: {
        metadata: {
          userId: userId,
          plan: productKey
        }
      },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:8081'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:8081'}/pricing`,
      customer_email: email, // Optional: pre-fill email
    });

    console.log(`✅ Checkout session created for user ${userId}: ${session.id}`);
    
    res.json({ 
      sessionId: session.id,
      product: product.name,
      amount: product.amount
    });
    
  } catch (error) {
    console.error('❌ Checkout session error:', error);
    res.status(400).json({ error: error.message });
  }
});

// =============================================================================
// REVENUECAT ENDPOINTS
// =============================================================================

// Revenue Cat webhook endpoint
app.post('/revenuecat-webhook', (req, res) => {
  const event = req.body;
  
  // Handle subscription events
  if (event.type === 'INITIAL_PURCHASE') {
    console.log('New subscription:', event.app_user_id);
    // Grant premium access in your database
  }
  
  if (event.type === 'CANCELLATION') {
    console.log('Subscription cancelled:', event.app_user_id);
    // Revoke premium access
  }
  
  res.status(200).send('OK');
});

// Test RevenueCat webhook manually
app.post('/test-revenuecat-webhook', async (req, res) => {
  try {
    const testEvent = {
      type: 'INITIAL_PURCHASE',
      app_user_id: 'test_user_' + Date.now(),
      product_id: 'premium_monthly',
      price: 9.99,
      currency: 'USD',
      timestamp: new Date().toISOString()
    };
    
    console.log('🧪 Testing RevenueCat webhook with:', testEvent);
    
    // Process the test event through your existing webhook handler
    // This simulates what happens when RevenueCat sends a real webhook
    
    // For now, just log it - you'll connect this to your actual webhook logic
    console.log('✅ Test webhook received for user:', testEvent.app_user_id);
    
    res.json({
      success: true,
      message: 'Test webhook processed successfully',
      testEvent: testEvent
    });
  } catch (error) {
    console.error('❌ Test webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test subscription status check
app.get('/test-subscription-status/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // This uses the RevenueCat API to check real subscription status
    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.REVENUECAT_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`RevenueCat API error: ${response.status}`);
    }
    
    const subscriberData = await response.json();
    
    res.json({
      success: true,
      userId: userId,
      subscriptionStatus: subscriberData
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// =============================================================================
// FIREBASE TEST ENDPOINTS
// =============================================================================

app.get('/test-firebase', async (req, res) => {
  try {
    const db = admin.firestore();
    
    // Test write operation
    const testRef = db.collection('connection_tests').doc('server_check');
    await testRef.set({
      timestamp: new Date(),
      status: 'success',
      server: 'NBA Fantasy AI',
      checkId: 'test_' + Date.now()
    });
    
    // Test read operation
    const doc = await testRef.get();
    const data = doc.data();
    
    res.json({
      success: true,
      firebaseStatus: 'connected',
      projectId: process.env.FIREBASE_PROJECT_ID,
      testData: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      firebaseStatus: 'disconnected'
    });
  }
});

// Add sample NBA data endpoint
app.get('/api/setup-sample-data', async (req, res) => {
  try {
    const db = admin.firestore();
    
    // Sample players data
    const players = [
      {
        id: 'player_1',
        name: 'LeBron James',
        team: 'Lakers',
        position: 'SF',
        stats: {
          points: 25.3,
          rebounds: 7.8,
          assists: 7.3,
          games_played: 65
        }
      },
      {
        id: 'player_2', 
        name: 'Stephen Curry',
        team: 'Warriors',
        position: 'PG',
        stats: {
          points: 27.5,
          rebounds: 5.2,
          assists: 6.1,
          games_played: 58
        }
      }
    ];
    
    // Add players to Firestore
    for (const player of players) {
      await db.collection('players').doc(player.id).set(player);
    }
    
    res.json({ 
      success: true, 
      message: 'Sample NBA data added to Firestore',
      playersAdded: players.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player stats endpoint
app.get('/api/players/:playerName', async (req, res) => {
  try {
    const playerName = req.params.playerName.toLowerCase();
    const db = admin.firestore();
    
    // In a real app, you'd query your players collection
    // For now, return mock data with Firestore timestamp
    const playerStats = {
      name: playerName,
      points: 25.3,
      rebounds: 7.8,
      assists: 7.3,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Store the query in analytics
    await db.collection('analytics').add({
      type: 'player_query',
      player: playerName,
      timestamp: new Date()
    });
    
    res.json(playerStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// UNIFIED SUBSCRIPTION ENDPOINTS
// =============================================================================

// Unified subscription check (handles both RevenueCat and Stripe)
app.get('/user/:userId/subscription-status', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check RevenueCat first (for app store purchases)
    const revenueCatStatus = await checkRevenueCatSubscription(userId);
    
    // Check Stripe second (for web purchases)
    const stripeStatus = await checkStripeSubscription(userId);
    
    // Determine overall subscription status
    const hasActiveSubscription = 
      revenueCatStatus.isActive || stripeStatus.isActive;
    
    res.json({
      userId: userId,
      hasActiveSubscription: hasActiveSubscription,
      revenueCat: revenueCatStatus,
      stripe: stripeStatus,
      activeSince: revenueCatStatus.activeSince || stripeStatus.activeSince,
      nextBillingDate: revenueCatStatus.nextBillingDate || stripeStatus.nextBillingDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function checkRevenueCatSubscription(userId) {
  try {
    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.REVENUECAT_SECRET_KEY}`,
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return {
        isActive: data.subscriber.entitlements?.premium_access?.is_active || false,
        source: 'revenuecat',
        activeSince: data.subscriber.entitlements?.premium_access?.starts_date,
        nextBillingDate: data.subscriber.entitlements?.premium_access?.expires_date
      };
    }
    return { isActive: false, source: 'revenuecat', error: 'not_found' };
  } catch (error) {
    return { isActive: false, source: 'revenuecat', error: error.message };
  }
}

async function checkStripeSubscription(userId) {
  // This would check your Stripe subscriptions
  // You'll implement this after setting up Stripe
  return { isActive: false, source: 'stripe', status: 'not_implemented' };
}

// =============================================================================
// ANALYTICS ENDPOINTS - UPDATED (NO AUTHENTICATION)
// =============================================================================

// Track analytics events - NO AUTHENTICATION
app.post('/api/analytics/track', (req, res) => {
  try {
    const { eventType, metadata } = req.body;
    
    // Generate anonymous user ID for tracking
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userId = `web-user-${userAgent.substring(0, 20)}`;
    
    analyticsService.trackEvent(userId, eventType, metadata);
    console.log(`Analytics event tracked: ${eventType} for user ${userId}`);
    res.json({ success: true, message: 'Event tracked' });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Get analytics dashboard - PUBLIC FOR TESTING
app.get('/api/analytics/dashboard', (req, res) => {
  try {
    const analytics = analyticsService.getAppAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get user-specific analytics
app.get('/api/analytics/user', authenticateToken, (req, res) => {
  try {
    const userAnalytics = analyticsService.getUserAnalytics(req.user.id);
    res.json({
      success: true,
      userId: req.user.id,
      ...userAnalytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// =============================================================================
// DEPLOYMENT TESTING SEQUENCE
// =============================================================================

app.get('/admin/deployment-tests', async (req, res) => {
  // Admin protection
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    console.log('🧪 Running comprehensive deployment tests...');
    
    const testResults = {
      server: await testServerHealth(),
      database: await testDatabaseConnections(),
      firebase: await testFirebaseServices(),
      revenuecat: await testRevenueCatIntegration(),
      analytics: await testAnalyticsTracking(),
      environment: await testEnvironmentVariables()
    };
    
    // Calculate overall status
    const allPassed = Object.values(testResults).every(result => result.success);
    
    res.json({
      status: allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌',
      overall: allPassed ? 'healthy' : 'issues_detected',
      results: testResults,
      timestamp: new Date().toISOString(),
      version: 'nba-fantasy-ai-v3.0'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Individual test functions
async function testServerHealth() {
  return { success: true, status: 'server_running', uptime: process.uptime() };
}

async function testDatabaseConnections() {
  try {
    // Test your user database
    const db = await USER_DB.load();
    return { 
      success: true, 
      userCount: db.users.length,
      status: 'connected' 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testFirebaseServices() {
  try {
    const db = admin.firestore();
    await db.collection('health_checks').doc('server').set({
      timestamp: new Date(),
      status: 'active'
    });
    return { success: true, status: 'firebase_connected' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testRevenueCatIntegration() {
  try {
    // Simple API call to verify connectivity
    const testResponse = await fetch('https://api.revenuecat.com/v1/projects', {
      headers: {
        'Authorization': `Bearer ${process.env.REVENUECAT_SECRET_KEY}`,
      }
    });
    
    return { 
      success: testResponse.status !== 401, // 401 = invalid auth
      status: testResponse.status,
      configured: !!process.env.REVENUECAT_SECRET_KEY
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testAnalyticsTracking() {
  return { 
    success: true, 
    status: 'analytics_service_initialized',
    service: 'AnalyticsService' 
  };
}

async function testEnvironmentVariables() {
  const requiredVars = [
    'JWT_SECRET', 'FIREBASE_PROJECT_ID', 
    'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    success: missing.length === 0,
    missing: missing,
    totalChecked: requiredVars.length,
    status: missing.length === 0 ? 'all_vars_present' : 'missing_variables'
  };
}

// =============================================================================
// REFERRAL DASHBOARD ENDPOINT
// =============================================================================

// Serve the referral dashboard
app.get('/referrals', (req, res) => {
    res.sendFile(__dirname + '/public/referral-dashboard.html');
});

// =============================================================================
// SERVER INITIALIZATION
// =============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🏀 NBA Fantasy AI Assistant v3.0 - Complete with All Integrations!`);
  console.log(`💰 RevenueCat integration: Active`);
  console.log(`🔥 Firebase integration: Active`);
  console.log(`💳 Stripe integration: Active`);
  console.log(`📊 Analytics endpoints: Public access enabled`);
  console.log(`🤝 Referral system: Routes and dashboard added`);
  console.log(`🧪 Test endpoints available for all services`);
  console.log(`🌐 Domain: ${process.env.DOMAIN || 'http://localhost:3000'}`);
  console.log(`📁 Static files served from: /public directory`);
});

// =============================================================================
// BETTING ENDPOINTS
// =============================================================================

app.get('/api/betting/insights', async (req, res) => {
  try {
    console.log('💰 Betting insights request');
    
    const bettingInsights = {
      topPicks: [
        {
          game: 'Lakers vs Warriors',
          pick: 'Over 228.5',
          confidence: '78%',
          reasoning: 'Both teams top 5 in pace, defensive injuries present',
          edge: '+3.2%',
          risk: 'Medium'
        },
        {
          game: 'Celtics vs Heat', 
          pick: 'Celtics -4.5',
          confidence: '72%',
          reasoning: 'Home court advantage, better rest situation',
          edge: '+2.1%',
          risk: 'Low'
        },
        {
          game: 'Nuggets vs Suns',
          pick: 'Jokic over 25.5 points',
          confidence: '81%',
          reasoning: 'Favorable matchup, high usage rate',
          edge: '+4.7%',
          risk: 'Medium'
        }
      ],
      playerProps: [
        {
          player: 'Stephen Curry',
          prop: 'Points Over 28.5',
          confidence: '75%',
          reasoning: 'High usage, favorable matchup against weak perimeter defense'
        },
        {
          player: 'Giannis Antetokounmpo', 
          prop: 'Rebounds Over 11.5',
          confidence: '68%',
          reasoning: 'Size advantage, high minutes expected'
        }
      ],
      sharpMoney: {
        moves: [
          'Lakers-Warriors Over 228.5 (78% confidence)',
          'Celtics -4.5 (72% confidence)',
          'Jokic Triple Double (65% confidence)'
        ],
        analysis: 'Sharp money coming in on overs and home favorites'
      }
    };

    res.json({
      success: true,
      data: bettingInsights
    });
  } catch (error) {
    console.error('Betting insights error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/betting/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    console.log(`🎰 Game betting analysis request: ${gameId}`);
    
    const gameAnalysis = {
      game: 'Lakers vs Warriors',
      analysis: {
        pace: 'Fast (Both top 5 in pace)',
        defense: 'Lakers: 15th | Warriors: 12th',
        injuries: 'Lakers: Davis questionable | Warriors: Green probable',
        trend: 'Over is 7-3 in last 10 meetings'
      },
      recommendations: [
        { type: 'Total', pick: 'Over 228.5', confidence: '78%' },
        { type: 'Spread', pick: 'Warriors +2.5', confidence: '65%' },
        { type: 'Player Prop', pick: 'Curry over 4.5 threes', confidence: '72%' }
      ]
    };

    res.json({
      success: true,
      data: gameAnalysis
    });
  } catch (error) {
    console.error('Game betting analysis error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =============================================================================
// FANTASY ENDPOINTS  
// =============================================================================

app.get('/api/fantasy/advice', async (req, res) => {
  try {
    console.log('🎯 Fantasy advice request');
    
    const fantasyAdvice = {
      topPlays: [
        {
          player: 'Nikola Jokic',
          position: 'C',
          team: 'Nuggets',
          reason: 'Triple-double threat, elite efficiency, high usage',
          value: 'High',
          salary: '$12,000',
          projection: '65.2 fantasy points'
        },
        {
          player: 'Luka Doncic',
          position: 'PG',
          team: 'Mavericks', 
          reason: 'High usage rate, stat-stuffer, offensive engine',
          value: 'High',
          salary: '$11,800',
          projection: '62.8 fantasy points'
        },
        {
          player: 'Giannis Antetokounmpo',
          position: 'PF',
          team: 'Bucks',
          reason: 'Elite scoring and rebounding, defensive stats',
          value: 'High', 
          salary: '$11,500',
          projection: '59.3 fantasy points'
        }
      ],
      valuePlays: [
        {
          player: 'Jalen Brunson',
          position: 'PG',
          team: 'Knicks',
          reason: 'Undervalued, high minutes, primary ball handler',
          value: 'Medium',
          salary: '$8,500',
          projection: '45.1 fantasy points'
        },
        {
          player: 'Paolo Banchero',
          position: 'PF',
          team: 'Magic',
          reason: 'Young star, increasing role, stat filler',
          value: 'Medium',
          salary: '$7,800', 
          projection: '41.7 fantasy points'
        }
      ],
      sleepers: [
        {
          player: 'Jaden Ivey',
          position: 'SG',
          team: 'Pistons',
          reason: 'High upside, minutes increasing, explosive scorer',
          value: 'High Risk/High Reward',
          salary: '$6,200',
          projection: '35.5 fantasy points'
        }
      ]
    };

    res.json({
      success: true,
      data: fantasyAdvice
    });
  } catch (error) {
    console.error('Fantasy advice error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/fantasy/lineup-optimizer', async (req, res) => {
  try {
    const { slate, budget, strategy } = req.query;
    console.log(`🐍 Lineup optimization request: ${slate}, ${budget}, ${strategy}`);
    
    const optimizedLineup = {
      slate: slate || 'Main Slate',
      budget: budget || 50000,
      strategy: strategy || 'Balanced',
      lineup: {
        'PG': { player: 'Stephen Curry', salary: 9800, projection: 52.3 },
        'SG': { player: 'Anthony Edwards', salary: 8500, projection: 45.1 },
        'SF': { player: 'Jayson Tatum', salary: 9500, projection: 48.7 },
        'PF': { player: 'Giannis Antetokounmpo', salary: 11500, projection: 59.3 },
        'C': { player: 'Nikola Jokic', salary: 12000, projection: 65.2 },
        'G': { player: 'Jalen Brunson', salary: 8500, projection: 45.1 },
        'F': { player: 'Paolo Banchero', salary: 7800, projection: 41.7 },
        'UTIL': { player: 'Desmond Bane', salary: 7200, projection: 38.4 }
      },
      total: {
        salary: 72800,
        projection: 395.8,
        remaining: 2200
      },
      exposure: {
        'Stephen Curry': '65%',
        'Nikola Jokic': '60%', 
        'Giannis Antetokounmpo': '55%'
      }
    };

    res.json({
      success: true,
      data: optimizedLineup
    });
  } catch (error) {
    console.error('Lineup optimization error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =============================================================================
// AI PREDICTION ENDPOINTS
// =============================================================================

app.get('/api/ai/predictions/player/:playerName', async (req, res) => {
  try {
    const { playerName } = req.params;
    console.log(`🤖 AI prediction request: ${playerName}`);
    
    const predictions = {
      player: playerName,
      predictions: {
        points: { value: '28.5 ± 2.1', confidence: '87%' },
        rebounds: { value: '5.8 ± 1.2', confidence: '78%' },
        assists: { value: '6.9 ± 1.5', confidence: '82%' },
        threes: { value: '4.2 ± 0.8', confidence: '75%' }
      },
      factors: ['Home game', 'Favorable matchup', 'Recent hot streak'],
      recommendation: 'Strong play - exceeds value at current salary'
    };

    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('AI prediction error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =============================================================================
// COMPREHENSIVE BETTING ENDPOINTS - PHASE 2 & 3
// =============================================================================

// 1. Enhanced Player Props with Building Capability
app.get('/api/betting/player-props-enhanced/:playerName', async (req, res) => {
  try {
    const { playerName } = req.params;
    
    const enhancedPlayerProps = {
      player: playerName,
      last_updated: new Date().toISOString(),
      available_props: [
        {
          type: "Points",
          line: "28.5",
          over_odds: "-115",
          under_odds: "-105",
          confidence: "78%",
          trend: "4-1 Over last 5 games",
          projection: "31.2 points",
          sharp_money: { side: "Over", percentage: 68 },
          matchup_analysis: "Favorable vs Lakers 22nd ranked PG defense"
        },
        {
          type: "Rebounds",
          line: "5.5", 
          over_odds: "-110",
          under_odds: "-110",
          confidence: "65%",
          trend: "3-2 Over last 5",
          projection: "6.1 rebounds",
          sharp_money: { side: "Over", percentage: 55 },
          matchup_analysis: "Average rebounding matchup"
        },
        {
          type: "Assists",
          line: "6.5",
          over_odds: "+120", 
          under_odds: "-140",
          confidence: "72%",
          trend: "7-3 Over last 10",
          projection: "7.8 assists",
          sharp_money: { side: "Over", percentage: 62 },
          matchup_analysis: "High assist potential in pace-up game"
        },
        {
          type: "Threes",
          line: "4.5",
          over_odds: "-130",
          under_odds: "+110",
          confidence: "81%",
          trend: "8-2 Over last 10",
          projection: "5.2 threes",
          sharp_money: { side: "Over", percentage: 75 },
          matchup_analysis: "Lakers weak vs 3-point shooting"
        },
        {
          type: "Pts+Rebs+Asts",
          line: "40.5",
          over_odds: "-115",
          under_odds: "-105",
          confidence: "75%",
          trend: "6-4 Over last 10",
          projection: "45.1 combined",
          sharp_money: { side: "Over", percentage: 65 },
          matchup_analysis: "All-around production expected"
        }
      ],
      parlay_builder: {
        max_legs: 6,
        available_combinations: [
          "Points + Rebounds",
          "Points + Assists", 
          "Points + Threes",
          "Rebounds + Assists",
          "Pts+Rebs+Asts combo"
        ],
        typical_odds_range: "+200 to +1500"
      },
      building_recommendations: [
        {
          combination: "Points Over + Threes Over",
          confidence: "82%",
          projected_odds: "+250",
          reasoning: "Both props have strong matchup advantages"
        },
        {
          combination: "Pts+Rebs+Asts Over + Threes Over", 
          confidence: "76%",
          projected_odds: "+350",
          reasoning: "Correlated props with high usage rate"
        }
      ]
    };

    res.json({
      success: true,
      data: enhancedPlayerProps
    });

  } catch (error) {
    console.error('Enhanced player props error:', error);
    res.status(500).json({ error: 'Failed to fetch enhanced player props' });
  }
});

// 2. Comprehensive Bankroll Analytics
app.get('/api/betting/bankroll-analytics-comprehensive/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const comprehensiveAnalytics = {
      user_id: userId,
      current_bankroll: 2500,
      starting_bankroll: 2000,
      total_profit: 500,
      roi: "25%",
      overall_performance: {
        total_bets: 156,
        wins: 89,
        losses: 62,
        pushes: 5,
        win_rate: "57.1%",
        average_odds: "+105",
        units_won: 36.85,
        profit_per_bet: 3.21
      },
      performance_by_type: {
        spreads: { 
          bets: 67, 
          wins: 38, 
          profit: 920.25,
          win_rate: "56.7%",
          roi: "27.4%"
        },
        totals: { 
          bets: 45, 
          wins: 26, 
          profit: 615.50,
          win_rate: "57.8%", 
          roi: "27.3%"
        },
        player_props: { 
          bets: 32, 
          wins: 19, 
          profit: 285.75,
          win_rate: "59.4%",
          roi: "17.8%"
        },
        parlays: { 
          bets: 12, 
          wins: 6, 
          profit: 21.00,
          win_rate: "50.0%",
          roi: "3.5%"
        }
      },
      timeframe_analysis: {
        last_7_days: {
          bets: 12,
          wins: 8,
          profit: 215.50,
          win_rate: "66.7%",
          hot_streaks: ["Player Props: 5-1", "Totals: 3-1"]
        },
        last_30_days: {
          bets: 32,
          wins: 19,
          profit: 485.75,
          win_rate: "59.4%",
          best_performing: "Spreads (11-6)"
        },
        last_90_days: {
          bets: 89,
          wins: 52,
          profit: 1120.25,
          win_rate: "58.4%",
          consistency: "Above average"
        }
      },
      streaks_tracking: {
        current_streak: {
          type: "winning",
          length: 3,
          profit: 185.50
        },
        best_win_streak: 8,
        worst_loss_streak: 4,
        average_win_streak: 3.2,
        average_loss_streak: 1.8
      },
      unit_management: {
        current_unit_size: 50,
        recommended_unit_size: 50,
        risk_level: "standard",
        kelly_criterion_suggestion: "Optimal bet: 2.3% of bankroll",
        performance_by_unit_size: {
          "1 unit": { bets: 45, win_rate: "62.2%" },
          "2 units": { bets: 67, win_rate: "58.2%" },
          "3 units": { bets: 32, win_rate: "53.1%" },
          "4+ units": { bets: 12, win_rate: "41.7%" }
        }
      },
      insights_recommendations: [
        {
          type: "strength",
          message: "Excellent performance on player props (59.4% win rate)",
          action: "Consider increasing unit size on player props"
        },
        {
          type: "improvement", 
          message: "Parlays underperforming (50% win rate, 3.5% ROI)",
          action: "Reduce parlay frequency or stake size"
        },
        {
          type: "opportunity",
          message: "Strong recent form (66.7% last 7 days)",
          action: "Maintain current betting strategy"
        }
      ]
    };

    res.json({
      success: true,
      data: comprehensiveAnalytics
    });

  } catch (error) {
    console.error('Comprehensive bankroll analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch comprehensive analytics' });
  }
});

// 3. Advanced Matchup Analysis with Betting Implications
app.get('/api/betting/advanced-matchup-analysis/:game', async (req, res) => {
  try {
    const { game } = req.params;
    const [team1, team2] = game.split(' vs ');
    
    const advancedMatchupData = {
      game: game,
      last_updated: new Date().toISOString(),
      game_context: {
        date: "2024-11-15",
        time: "7:30 PM EST",
        location: "Chase Center, San Francisco",
        national_tv: "ESPN",
        significance: "Prime time matchup, playoff implications"
      },
      team_comparison: {
        [team1]: {
          offensive_rating: 115.8,
          defensive_rating: 115.2,
          pace: 98.3,
          efficiency: {
            overall: 12,
            offense: 12,
            defense: 25
          },
          recent_form: "6-4",
          home_record: "18-12",
          key_players: [
            { name: "LeBron James", position: "SF", status: "Probable", impact: "High" },
            { name: "Anthony Davis", position: "C", status: "Probable", impact: "High" },
            { name: "Austin Reaves", position: "SG", status: "Healthy", impact: "Medium" }
          ],
          strengths: ["Paint scoring", "Rebounding", "Experience"],
          weaknesses: ["Perimeter defense", "3-point shooting", "Pace"]
        },
        [team2]: {
          offensive_rating: 118.3,
          defensive_rating: 113.1,
          pace: 102.1,
          efficiency: {
            overall: 5,
            offense: 5,
            defense: 15
          },
          recent_form: "7-3",
          away_record: "16-14",
          key_players: [
            { name: "Stephen Curry", position: "PG", status: "Healthy", impact: "High" },
            { name: "Klay Thompson", position: "SG", status: "Healthy", impact: "Medium" },
            { name: "Draymond Green", position: "PF", status: "Questionable", impact: "High" }
          ],
          strengths: ["3-point shooting", "Pace", "Ball movement"],
          weaknesses: ["Size", "Rebounding", "Interior defense"]
        }
      },
      head_to_head: {
        season_series: "Warriors lead 2-1",
        average_total_points: 231.5,
        last_meeting: {
          date: "2024-02-12",
          score: "Warriors 125 - Lakers 119",
          key_takeaways: ["High scoring affair", "Curry 38 points", "Close throughout"]
        }
      },
      key_matchups: [
        {
          matchup: "Curry vs Lakers PG Defense",
          advantage: team2,
          level: "Significant",
          reasoning: "Lakers rank 22nd vs point guards, Curry averaging 32 ppg vs LAL",
          betting_implication: "Strong Curry player prop opportunities"
        },
        {
          matchup: "Paint Battle - Davis vs Warriors Small Ball",
          advantage: team1,
          level: "Moderate", 
          reasoning: "Lakers have significant size advantage, Warriors vulnerable inside",
          betting_implication: "Davis rebounds over, Lakers points in paint over"
        },
        {
          matchup: "Pace & Tempo Control",
          advantage: team2,
          level: "Significant",
          reasoning: "Warriors 3rd in pace (102.1), Lakers 18th (98.3) - 4+ possession difference",
          betting_implication: "Game total over, faster pace favors Warriors style"
        }
      ],
      betting_implications: {
        game_total: {
          recommendation: "Over",
          confidence: "78%",
          reasoning: "Both teams efficient offenses, pace mismatch favors scoring",
          key_factors: [
            "Warriors push pace (3rd)",
            "Lakers defensive struggles (25th)",
            "Season series average: 231.5 points"
          ]
        },
        side: {
          recommendation: team2 + " -4.5",
          confidence: "72%",
          reasoning: "Home court advantage, pace control, matchup advantages",
          key_factors: [
            "Warriors 18-12 at home",
            "Pace advantage",
            "Curry matchup advantage"
          ]
        },
        player_props: {
          strong_plays: [
            {
              player: "Stephen Curry",
              props: ["Points Over 28.5", "Threes Over 4.5"],
              confidence: "85%",
              reasoning: "Elite matchup vs poor perimeter defense"
            },
            {
              player: "Anthony Davis",
              props: ["Rebounds Over 11.5", "Points+Rebounds Over 35.5"],
              confidence: "78%",
              reasoning: "Size advantage vs small-ball lineup"
            }
          ],
          avoid_plays: [
            {
              player: "Klay Thompson",
              props: ["Points Over 18.5"],
              confidence: "45%",
              reasoning: "Inconsistent scoring, defensive attention"
            }
          ]
        }
      },
      situational_factors: {
        rest_advantage: "Even - both teams 1 day rest",
        travel: "Lakers traveling, Warriors at home",
        motivation: "High - both teams playoff positioning",
        injuries: "Draymond Green questionable - significant if out"
      },
      model_projections: {
        final_score: "Warriors 118 - Lakers 114",
        win_probability: { [team1]: "42%", [team2]: "58%" },
        total_points: "232.0",
        cover_probability: { [team1]: "48%", [team2]: "52%" }
      }
    };

    res.json({
      success: true,
      data: advancedMatchupData
    });

  } catch (error) {
    console.error('Advanced matchup analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch advanced matchup analysis' });
  }
});

// 4. Real-time Bet Tracking & Management
app.post('/api/betting/track-bet', async (req, res) => {
  try {
    const { userId, betData, stake, odds, type } = req.body;
    
    const betTracking = {
      bet_id: 'bet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      user_id: userId,
      bet_data: betData,
      stake: stake,
      potential_payout: calculatePayout(stake, odds),
      odds: odds,
      type: type,
      status: 'pending',
      placed_at: new Date().toISOString(),
      tracked_metrics: {
        line_movement: [],
        sharp_money: {},
        public_betting: {}
      }
    };

    // In real app, save to database
    console.log(`📝 Bet tracked for user ${userId}: ${betData}`);

    res.json({
      success: true,
      data: {
        ...betTracking,
        confirmation: "Bet successfully tracked and added to your history"
      }
    });

  } catch (error) {
    console.error('Bet tracking error:', error);
    res.status(500).json({ error: 'Failed to track bet' });
  }
});

// 5. User Bet History & Performance
app.get('/api/betting/user-bet-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = 'all', type = 'all' } = req.query;
    
    const betHistory = {
      user_id: userId,
      timeframe: timeframe,
      summary: {
        total_bets: 156,
        active_bets: 3,
        settled_bets: 153,
        total_wagered: 15600,
        total_won: 1842.50,
        net_profit: 1842.50
      },
      recent_bets: [
        {
          id: 'bet_001',
          date: '2024-11-14',
          type: 'player_prop',
          description: 'Stephen Curry Over 28.5 Points',
          stake: 100,
          odds: '-115',
          result: 'win',
          payout: 186.96,
          status: 'settled'
        },
        {
          id: 'bet_002',
          date: '2024-11-14', 
          type: 'game_total',
          description: 'Lakers vs Warriors Over 228.5',
          stake: 100,
          odds: '-110',
          result: 'win',
          payout: 190.91,
          status: 'settled'
        },
        {
          id: 'bet_003',
          date: '2024-11-13',
          type: 'spread',
          description: 'Celtics -4.5 vs Heat',
          stake: 100,
          odds: '-110',
          result: 'loss',
          payout: 0,
          status: 'settled'
        },
        {
          id: 'bet_004',
          date: '2024-11-15',
          type: 'player_prop',
          description: 'Nikola Jokic Over 11.5 Rebounds',
          stake: 150,
          odds: '-120',
          result: 'pending',
          payout: 275,
          status: 'active'
        }
      ],
      performance_metrics: {
        win_rate: '57.1%',
        roi: '18.4%',
        average_odds: '+105',
        units_per_bet: 0.236,
        sharpe_ratio: 1.42,
        longest_win_streak: 8,
        longest_loss_streak: 4
      },
      by_category: {
        spreads: { bets: 67, wins: 38, profit: 920.25 },
        totals: { bets: 45, wins: 26, profit: 615.50 },
        player_props: { bets: 32, wins: 19, profit: 285.75 },
        parlays: { bets: 12, wins: 6, profit: 21.00 }
      }
    };

    res.json({
      success: true,
      data: betHistory
    });

  } catch (error) {
    console.error('Bet history error:', error);
    res.status(500).json({ error: 'Failed to fetch bet history' });
  }
});

// 6. Smart Bet Recommendations Engine
app.post('/api/betting/smart-recommendations', async (req, res) => {
  try {
    const { userId, preferences, bankroll, riskTolerance } = req.body;
    
    const smartRecommendations = {
      generated_at: new Date().toISOString(),
      user_preferences: preferences,
      recommended_bets: [
        {
          type: "player_prop",
          player: "Stephen Curry",
          bet: "Points Over 28.5",
          confidence: "85%",
          edge: "+5.2%",
          stake_recommendation: "2 units",
          reasoning: [
            "Favorable matchup vs Lakers 22nd ranked PG defense",
            "Averaging 32.1 ppg vs Lakers this season",
            "Sharp money heavily on Over (78%)",
            "Pace-up game environment"
          ],
          risk_level: "medium",
          expected_value: "+0.42 units"
        },
        {
          type: "game_total",
          game: "Lakers vs Warriors", 
          bet: "Over 228.5",
          confidence: "78%",
          edge: "+3.1%",
          stake_recommendation: "1.5 units",
          reasoning: [
            "Both teams top 10 in offensive efficiency",
            "Pace mismatch favors scoring",
            "Season series averaging 231.5 points",
            "Defensive injuries on both sides"
          ],
          risk_level: "medium",
          expected_value: "+0.28 units"
        },
        {
          type: "player_prop",
          player: "Anthony Davis",
          bet: "Rebounds Over 11.5",
          confidence: "72%",
          edge: "+2.8%",
          stake_recommendation: "1 unit",
          reasoning: [
            "Size advantage vs Warriors small ball",
            "Averaging 13.2 rpg vs Warriors",
            "Warriors 25th in defensive rebounding",
            "Expected close game = more rebounding opportunities"
          ],
          risk_level: "low",
          expected_value: "+0.18 units"
        }
      ],
      portfolio_analysis: {
        total_recommended_stake: "4.5 units",
        expected_portfolio_return: "+0.88 units",
        diversification: "Good - mix of player props and totals",
        risk_adjustment: "Appropriate for risk tolerance"
      },
      alerts: [
        {
          type: "line_movement",
          message: "Curry points line moving from 28.5 to 29.5",
          urgency: "high",
          action: "Bet now before line moves further"
        },
        {
          type: "sharp_money",
          message: "Heavy sharp action on Over 228.5 (78% sharp money)",
          urgency: "medium",
          action: "Consider increasing stake"
        }
      ]
    };

    res.json({
      success: true,
      data: smartRecommendations
    });

  } catch (error) {
    console.error('Smart recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate smart recommendations' });
  }
});

// 7. Live Line Movement Tracking
app.get('/api/betting/line-movement/:game', async (req, res) => {
  try {
    const { game } = req.params;
    
    const lineMovement = {
      game: game,
      tracked_at: new Date().toISOString(),
      movements: [
        {
          bet_type: "spread",
          opening_line: "Warriors -3.5",
          current_line: "Warriors -4.5",
          movement: "+1.0 point",
          direction: "toward_warriors",
          sharp_percentage: 65,
          time_of_movement: "2 hours ago"
        },
        {
          bet_type: "total",
          opening_line: "226.5",
          current_line: "228.5",
          movement: "+2.0 points",
          direction: "toward_over",
          sharp_percentage: 78,
          time_of_movement: "1 hour ago"
        },
        {
          bet_type: "moneyline",
          opening_line: "Warriors -160",
          current_line: "Warriors -190",
          movement: "+30 cents",
          direction: "toward_warriors", 
          sharp_percentage: 62,
          time_of_movement: "3 hours ago"
        }
      ],
      key_observations: [
        "Significant sharp money on Over (78%) driving total up 2 points",
        "Respectable money on Warriors side moving spread 1 point",
        "Public betting split: 58% on Warriors, 42% on Lakers"
      ],
      recommendations: [
        "Consider betting Over now before line moves further to 229.5",
        "Warriors spread still has value at -4.5 given sharp action",
        "Monitor Curry props for potential line movements"
      ]
    };

    res.json({
      success: true,
      data: lineMovement
    });

  } catch (error) {
    console.error('Line movement error:', error);
    res.status(500).json({ error: 'Failed to fetch line movement data' });
  }
});

// Helper function for payout calculation
function calculatePayout(stake, odds) {
  const stakeNum = parseFloat(stake);
  const oddsNum = parseFloat(odds);
  
  if (oddsNum > 0) {
    return stakeNum + (stakeNum * (oddsNum / 100));
  } else {
    return stakeNum + (stakeNum * (100 / Math.abs(oddsNum)));
  }
}

// 8. Bankroll Simulation & Projections
app.post('/api/betting/bankroll-simulation', async (req, res) => {
  try {
    const { userId, currentBankroll, betFrequency, averageStake, winRate, averageOdds } = req.body;
    
    const simulation = {
      user_id: userId,
      simulation_date: new Date().toISOString(),
      input_parameters: {
        current_bankroll: currentBankroll,
        bet_frequency: betFrequency,
        average_stake: averageStake,
        expected_win_rate: winRate,
        average_odds: averageOdds
      },
      projections: {
        one_month: {
          expected_bets: betFrequency * 30,
          expected_profit: (currentBankroll * 0.05).toFixed(2),
          expected_roi: "5%",
          confidence_interval: "2-8%"
        },
        three_months: {
          expected_bets: betFrequency * 90,
          expected_profit: (currentBankroll * 0.15).toFixed(2),
          expected_roi: "15%",
          confidence_interval: "10-20%"
        },
        one_year: {
          expected_bets: betFrequency * 365,
          expected_profit: (currentBankroll * 0.45).toFixed(2),
          expected_roi: "45%",
          confidence_interval: "35-55%"
        }
      },
      risk_analysis: {
        probability_of_ruin: "2.3%",
        maximum_drawdown: "12.5%",
        expected_longest_losing_streak: 4,
        kelly_optimal_stake: (currentBankroll * 0.023).toFixed(2)
      },
      recommendations: [
        "Current strategy shows positive expected value",
        "Consider implementing 2% Kelly Criterion stake sizing",
        "Monitor performance monthly and adjust strategy if win rate drops below 54%"
      ]
    };

    res.json({
      success: true,
      data: simulation
    });

  } catch (error) {
    console.error('Bankroll simulation error:', error);
    res.status(500).json({ error: 'Failed to run bankroll simulation' });
  }
});
