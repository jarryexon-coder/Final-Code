import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import axios from 'axios';

const router = express.Router();

// ====================
// EXTERNAL PREDICTION API INTEGRATION
// ====================

/**
 * @swagger
 * /api/predictions/game/{gameId}:
 *   get:
 *     summary: Get game predictions from external API
 *     description: Retrieve AI-powered game predictions using RAPIDAPI_KEY_PREDICTION
 *     tags: [Predictions]
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Game ID from external API
 *       - in: query
 *         name: includeOdds
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include betting odds in prediction
 *       - in: query
 *         name: includeInjuries
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include injury reports in analysis
 *     responses:
 *       200:
 *         description: Game prediction data from external API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     predictionId:
 *                       type: string
 *                     gameId:
 *                       type: integer
 *                     predictedWinner:
 *                       type: string
 *                     confidence:
 *                       type: number
 *                     predictedScore:
 *                       type: object
 *                     keyFactors:
 *                       type: array
 *                       items:
 *                         type: string
 *                     bettingInsights:
 *                       type: object
 *       404:
 *         description: Game prediction not found
 *       500:
 *         description: Server error or external API error
 */
router.get('/game/:gameId', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { includeOdds = true, includeInjuries = true } = req.query;

    // Fetch game prediction from external API
    const response = await axios.get(`https://api-football-v1.p.rapidapi.com/v3/predictions`, {
      params: {
        fixture: gameId
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY_PREDICTION,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      }
    });

    if (!response.data || !response.data.response || response.data.response.length === 0) {
      // If no prediction available, return a generated prediction
      return res.status(404).json({
        success: false,
        error: 'No external prediction available for this game',
        suggestion: 'Use /api/predictions/generate endpoint for AI-generated predictions'
      });
    }

    const externalPrediction = response.data.response[0];
    
    // Format the prediction response
    const prediction = {
      predictionId: `ext_pred_${gameId}_${Date.now()}`,
      gameId: parseInt(gameId),
      homeTeam: externalPrediction.teams.home.name,
      awayTeam: externalPrediction.teams.away.name,
      predictedWinner: externalPrediction.predictions.winner.name,
      confidence: parseFloat(externalPrediction.predictions.percent) / 100,
      predictedScore: {
        home: externalPrediction.predictions.goals.home,
        away: externalPrediction.predictions.goals.away
      },
      keyFactors: externalPrediction.predictions.winner.reason
        ? [externalPrediction.predictions.winner.reason]
        : ['Team form analysis', 'Head-to-head record', 'Home advantage'],
      predictionDetails: {
        advice: externalPrediction.predictions.advice,
        underOver: externalPrediction.predictions.under_over,
        goals: externalPrediction.predictions.goals,
        percent: externalPrediction.predictions.percent
      }
    };

    // Include odds if requested
    if (includeOdds && externalPrediction.odds) {
      prediction.bettingOdds = {
        homeWin: externalPrediction.odds.home,
        draw: externalPrediction.odds.draw,
        awayWin: externalPrediction.odds.away,
        source: externalPrediction.odds.source
      };
    }

    // Include injuries if requested
    if (includeInjuries && externalPrediction.teams.home.players && externalPrediction.teams.away.players) {
      prediction.injuryReport = {
        homeTeamInjuries: externalPrediction.teams.home.players
          .filter(p => p.injured || p.suspended)
          .map(p => ({ name: p.name, reason: p.reason })),
        awayTeamInjuries: externalPrediction.teams.away.players
          .filter(p => p.injured || p.suspended)
          .map(p => ({ name: p.name, reason: p.reason }))
      };
    }

    // Save prediction to local database
    if (mongoose.connection.readyState === 1) {
      try {
        const db = mongoose.connection.db;
        const predictionRecord = {
          ...prediction,
          userId: req.user?.userId,
          source: 'external_api',
          fetchedAt: new Date(),
          apiProvider: 'RapidAPI Football Predictions'
        };
        
        await db.collection('external_predictions').insertOne(predictionRecord);
      } catch (dbError) {
        console.warn('Could not save external prediction to database:', dbError.message);
      }
    }

    res.status(200).json({
      success: true,
      data: prediction,
      metadata: {
        source: 'external_api',
        timestamp: new Date().toISOString(),
        apiVersion: 'v3'
      }
    });

  } catch (error) {
    console.error('Error fetching game prediction:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Game not found in external prediction API'
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch game prediction'
    });
  }
});

/**
 * @swagger
 * /api/predictions/player/{playerId}:
 *   get:
 *     summary: Get player performance predictions
 *     description: Retrieve player performance predictions using RAPIDAPI_KEY_PREDICTION
 *     tags: [Predictions]
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Player ID from external API
 *       - in: query
 *         name: season
 *         schema:
 *           type: integer
 *           default: 2024
 *         description: Season year
 *       - in: query
 *         name: nextNGames
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of upcoming games to predict
 *       - in: query
 *         name: includeProjections
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include statistical projections
 *     responses:
 *       200:
 *         description: Player performance predictions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     playerId:
 *                       type: integer
 *                     playerName:
 *                       type: string
 *                     season:
 *                       type: integer
 *                     upcomingPredictions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     seasonProjections:
 *                       type: object
 *                     injuryRisk:
 *                       type: string
 *       404:
 *         description: Player predictions not found
 *       500:
 *         description: Server error or external API error
 */
router.get('/player/:playerId', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { season = 2024, nextNGames = 5, includeProjections = true } = req.query;

    // For demonstration, we'll use a mock response since specific player prediction APIs vary
    // In production, replace with actual external API call
    
    // Mock external API response structure
    const mockPlayerData = {
      player: {
        id: parseInt(playerId),
        name: "LeBron James",
        team: "Los Angeles Lakers",
        position: "SF"
      },
      predictions: [
        {
          gameDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          opponent: "Golden State Warriors",
          predictedPoints: 28.5,
          predictedRebounds: 7.8,
          predictedAssists: 8.2,
          predictedMinutes: 36.5,
          confidence: 0.82,
          keyFactor: "Matchup against weaker defense"
        },
        {
          gameDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          opponent: "Denver Nuggets",
          predictedPoints: 25.3,
          predictedRebounds: 6.5,
          predictedAssists: 7.8,
          predictedMinutes: 34.2,
          confidence: 0.75,
          keyFactor: "High altitude may affect stamina"
        }
      ],
      seasonProjections: {
        pointsPerGame: 27.1,
        reboundsPerGame: 7.4,
        assistsPerGame: 7.9,
        gamesPlayed: 68,
        efficiencyRating: 24.8,
        usageRate: 29.5
      },
      injuryRisk: "Low - No recent injury concerns"
    };

    // Format the response
    const prediction = {
      playerId: parseInt(playerId),
      playerName: mockPlayerData.player.name,
      team: mockPlayerData.player.team,
      position: mockPlayerData.player.position,
      season: parseInt(season),
      upcomingPredictions: mockPlayerData.predictions.slice(0, nextNGames),
      seasonProjections: includeProjections ? mockPlayerData.seasonProjections : null,
      injuryRisk: mockPlayerData.injuryRisk,
      lastUpdated: new Date().toISOString()
    };

    // Save to local database
    if (mongoose.connection.readyState === 1) {
      try {
        const db = mongoose.connection.db;
        await db.collection('player_predictions').insertOne({
          ...prediction,
          userId: req.user?.userId,
          source: 'external_api_mock',
          fetchedAt: new Date()
        });
      } catch (dbError) {
        console.warn('Could not save player prediction to database:', dbError.message);
      }
    }

    res.status(200).json({
      success: true,
      data: prediction,
      metadata: {
        note: "Using mock data - integrate with actual player prediction API",
        timestamp: new Date().toISOString(),
        gamesPredicted: Math.min(nextNGames, mockPlayerData.predictions.length)
      }
    });

  } catch (error) {
    console.error('Error fetching player predictions:', error.response?.data || error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch player predictions'
    });
  }
});

// ====================
// PREDICTION GENERATION
// ====================

/**
 * @swagger
 * /api/predictions/generate:
 *   post:
 *     summary: Generate AI prediction
 *     description: Generate AI-powered game predictions
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameId
 *             properties:
 *               gameId:
 *                 type: string
 *               team1:
 *                 type: string
 *               team2:
 *                 type: string
 *               sport:
 *                 type: string
 *                 default: NBA
 *               predictionType:
 *                 type: string
 *                 default: outcome
 *               includeAnalysis:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: AI-generated prediction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 predictionId:
 *                   type: string
 *                 predictedWinner:
 *                   type: string
 *                 confidence:
 *                   type: number
 *                 predictedScore:
 *                   type: object
 *                 bettingRecommendation:
 *                   type: object
 *                 keyFactors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    console.log('🤖 Generating AI prediction');
    
    const { 
      gameId, 
      team1, 
      team2, 
      sport = 'NBA', 
      predictionType = 'outcome',
      includeAnalysis = true 
    } = req.body;

    // Validate required fields
    if (!gameId || (!team1 && !team2)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: gameId and at least one team required'
      });
    }

    // Mock AI prediction logic (replace with actual AI model)
    const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate mock prediction based on input
    const homeTeam = team1 || 'Home Team';
    const awayTeam = team2 || 'Away Team';
    const winner = Math.random() > 0.5 ? homeTeam : awayTeam;
    const confidence = (Math.random() * 0.3 + 0.65).toFixed(3); // 65-95% confidence
    
    const prediction = {
      success: true,
      predictionId,
      sport,
      game: {
        gameId,
        homeTeam,
        awayTeam,
        date: new Date().toISOString().split('T')[0]
      },
      predictionType,
      predictedWinner: winner,
      confidence: parseFloat(confidence),
      predictedScore: {
        home: Math.floor(Math.random() * 30 + 90),
        away: Math.floor(Math.random() * 30 + 85)
      },
      bettingRecommendation: {
        recommendedBet: Math.random() > 0.5 ? 'Moneyline' : 'Spread',
        confidence: parseFloat((Math.random() * 0.2 + 0.6).toFixed(3)),
        suggestedStake: '1-2% of bankroll',
        expectedValue: (Math.random() * 0.15 + 0.05).toFixed(3)
      },
      keyFactors: [
        'Team momentum in last 5 games',
        'Home court advantage',
        'Head-to-head historical record',
        'Injury reports and player availability',
        'Rest days and travel schedule',
        'Recent team performance trends'
      ],
      riskLevel: Math.random() > 0.7 ? 'High' : (Math.random() > 0.4 ? 'Medium' : 'Low'),
      timestamp: new Date().toISOString(),
      metadata: {
        userId: req.user?.userId || 'anonymous',
        modelVersion: 'ai-predictor-v1.2.0',
        processingTime: '520ms',
        cacheHit: false
      }
    };

    // Include AI analysis if requested
    if (includeAnalysis) {
      prediction.aiAnalysis = {
        teamMatchupAnalysis: `${homeTeam} has shown strong defense in recent games, while ${awayTeam}'s offense has been inconsistent.`,
        keyPlayerInsight: 'Watch for the point guard matchup, which could determine the pace of the game.',
        statisticalEdge: `${winner} has a ${(Math.random() * 15 + 55).toFixed(1)}% probability of covering the spread.`,
        weatherImpact: 'Indoor arena - no weather factors to consider.',
        injuryImpact: 'No major injuries reported for either team.',
        trendSpotting: `${homeTeam} has covered in 4 of their last 5 home games.`
      };
    }

    // Save prediction to database if user is authenticated
    if (req.user?.userId && mongoose.connection.readyState === 1) {
      try {
        const db = mongoose.connection.db;
        const predictionRecord = {
          ...prediction,
          userId: req.user.userId,
          savedAt: new Date(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        
        await db.collection('predictions').insertOne(predictionRecord);
        console.log(`💾 Prediction saved to database: ${predictionId}`);
        
        // Update user's prediction history
        await db.collection('users').updateOne(
          { _id: new mongoose.Types.ObjectId(req.user.userId) },
          { 
            $push: { 
              predictionHistory: {
                predictionId,
                generatedAt: new Date(),
                sport,
                gameId
              }
            },
            $inc: { 'usage.predictionCount': 1 }
          }
        );
      } catch (dbError) {
        console.error('⚠️ Failed to save prediction to database:', dbError.message);
        // Continue without saving - prediction still generated
      }
    }

    res.status(200).json(prediction);

  } catch (error) {
    console.error('❌ Error generating prediction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate prediction',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ====================
// PREDICTION HISTORY
// ====================

/**
 * @swagger
 * /api/predictions/history:
 *   get:
 *     summary: Get user's prediction history
 *     description: Retrieve authenticated user's prediction history with filtering
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of predictions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *         description: Filter by sport
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: User's prediction history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     predictions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                     stats:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      sport,
      startDate,
      endDate 
    } = req.query;

    const userId = req.user.userId;

    // Build query
    const query = { userId };
    if (sport) query['game.sport'] = sport;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Get predictions from database
    let predictions = [];
    let totalCount = 0;

    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      totalCount = await db.collection('predictions').countDocuments(query);
      
      predictions = await db.collection('predictions')
        .find(query)
        .sort({ timestamp: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .toArray();
    } else {
      // Return mock data if DB not connected
      predictions = Array.from({ length: Math.min(5, limit) }, (_, i) => ({
        predictionId: `mock_pred_${i}`,
        sport: sport || 'NBA',
        game: { homeTeam: 'Mock Team A', awayTeam: 'Mock Team B' },
        predictedWinner: i % 2 === 0 ? 'Mock Team A' : 'Mock Team B',
        confidence: 0.7 + (i * 0.05),
        timestamp: new Date(Date.now() - i * 86400000).toISOString()
      }));
      totalCount = predictions.length;
    }

    // Calculate stats
    const stats = {
      totalPredictions: totalCount,
      accuracyRate: '68.5%', // Mock - calculate from actual results in production
      mostConfidentSport: 'NBA',
      averageConfidence: '72.3%'
    };

    res.status(200).json({
      success: true,
      data: {
        predictions,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: totalCount > parseInt(offset) + parseInt(limit)
        },
        stats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching prediction history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prediction history'
    });
  }
});

// ====================
// PREDICTION DETAILS
// ====================

/**
 * @swagger
 * /api/predictions/{predictionId}:
 *   get:
 *     summary: Get specific prediction details
 *     description: Retrieve details of a specific prediction by ID
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: predictionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Prediction ID
 *     responses:
 *       200:
 *         description: Prediction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Prediction not found
 *       500:
 *         description: Server error
 */
router.get('/:predictionId', authenticateToken, async (req, res) => {
  try {
    const { predictionId } = req.params;
    const userId = req.user.userId;

    let prediction = null;

    // Try to fetch from database
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      prediction = await db.collection('predictions').findOne({
        predictionId,
        userId
      });
    }

    // If not found in DB or DB not connected, check mock
    if (!prediction) {
      // Check if this is a mock prediction ID pattern
      if (predictionId.startsWith('pred_') || predictionId.startsWith('mock_')) {
        // Return mock prediction
        prediction = {
          predictionId,
          sport: 'NBA',
          game: { homeTeam: 'Los Angeles Lakers', awayTeam: 'Golden State Warriors' },
          predictedWinner: 'Los Angeles Lakers',
          confidence: 0.75,
          predictedScore: { home: 112, away: 108 },
          bettingRecommendation: {
            recommendedBet: 'Moneyline',
            confidence: 0.68,
            suggestedStake: '1.5%'
          },
          timestamp: new Date().toISOString(),
          note: 'Mock prediction data - real predictions saved to database'
        };
      } else {
        return res.status(404).json({
          success: false,
          error: 'Prediction not found'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching prediction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prediction'
    });
  }
});

// ====================
// PREDICTION FEEDBACK
// ====================

/**
 * @swagger
 * /api/predictions/{predictionId}/feedback:
 *   post:
 *     summary: Submit feedback on prediction accuracy
 *     description: Submit user feedback on prediction accuracy
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: predictionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Prediction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actualWinner
 *               - accuracyRating
 *             properties:
 *               actualWinner:
 *                 type: string
 *               actualScore:
 *                 type: object
 *               accuracyRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:predictionId/feedback', authenticateToken, async (req, res) => {
  try {
    const { predictionId } = req.params;
    const { 
      actualWinner, 
      actualScore,
      accuracyRating, // 1-5 scale
      notes 
    } = req.body;
    const userId = req.user.userId;

    if (!actualWinner || !accuracyRating) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: actualWinner and accuracyRating'
      });
    }

    const feedback = {
      predictionId,
      userId,
      actualWinner,
      actualScore: actualScore || { home: 0, away: 0 },
      accuracyRating: parseInt(accuracyRating),
      notes: notes || '',
      submittedAt: new Date(),
      ipAddress: req.ip
    };

    // Save feedback to database
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      
      // Save feedback
      await db.collection('prediction_feedback').insertOne(feedback);
      
      // Update prediction with feedback reference
      await db.collection('predictions').updateOne(
        { predictionId, userId },
        { $set: { feedbackReceived: true, lastUpdated: new Date() } }
      );
      
      console.log(`📝 Feedback saved for prediction: ${predictionId}`);
    }

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedback._id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

// ====================
// BATCH PREDICTIONS
// ====================

/**
 * @swagger
 * /api/predictions/batch:
 *   post:
 *     summary: Generate predictions for multiple games
 *     description: Generate AI predictions for multiple games in a batch
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - games
 *             properties:
 *               games:
 *                 type: array
 *                 items:
 *                   type: object
 *                 maxItems: 10
 *               sport:
 *                 type: string
 *                 default: NBA
 *     responses:
 *       200:
 *         description: Batch predictions generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 batchId:
 *                   type: string
 *                 predictions:
 *                   type: array
 *                   items:
 *                     type: object
 *                 summary:
 *                   type: object
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const { games, sport = 'NBA' } = req.body;

    if (!Array.isArray(games) || games.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Games array is required and cannot be empty'
      });
    }

    if (games.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 games allowed in batch'
      });
    }

    // Generate predictions for each game
    const batchPredictions = await Promise.all(
      games.map(async (game, index) => {
        // Simulate processing delay for each prediction
        await new Promise(resolve => setTimeout(resolve, 200 * (index + 1)));
        
        const predictionId = `batch_pred_${Date.now()}_${index}`;
        const winner = Math.random() > 0.5 ? game.team1 : game.team2;
        
        return {
          predictionId,
          gameId: game.gameId || `game_${index}`,
          sport,
          teams: {
            team1: game.team1,
            team2: game.team2
          },
          predictedWinner: winner,
          confidence: (Math.random() * 0.25 + 0.65).toFixed(3),
          keyInsight: `${winner} has the edge due to ${['home advantage', 'recent form', 'head-to-head record', 'injury situation'][index % 4]}`,
          recommendedBet: Math.random() > 0.5 ? 'Moneyline' : 'Point Spread',
          processingOrder: index + 1
        };
      })
    );

    // Save batch to database if authenticated
    if (req.user?.userId && mongoose.connection.readyState === 1) {
      try {
        const db = mongoose.connection.db;
        const batchRecord = {
          batchId: `batch_${Date.now()}`,
          userId: req.user.userId,
          predictions: batchPredictions,
          totalGames: games.length,
          sport,
          generatedAt: new Date()
        };
        
        await db.collection('prediction_batches').insertOne(batchRecord);
      } catch (dbError) {
        console.error('⚠️ Failed to save batch predictions:', dbError.message);
      }
    }

    res.status(200).json({
      success: true,
      batchId: `batch_${Date.now()}`,
      totalPredictions: batchPredictions.length,
      sport,
      predictions: batchPredictions,
      summary: {
        favoriteWins: batchPredictions.filter(p => p.confidence > 0.7).length,
        underdogWins: batchPredictions.filter(p => p.confidence <= 0.7).length,
        averageConfidence: (batchPredictions.reduce((sum, p) => sum + parseFloat(p.confidence), 0) / batchPredictions.length).toFixed(3)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating batch predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate batch predictions'
    });
  }
});

// ====================
// PREDICTION STATISTICS
// ====================

/**
 * @swagger
 * /api/predictions/stats/summary:
 *   get:
 *     summary: Get prediction statistics
 *     description: Retrieve user's prediction statistics and performance metrics
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prediction statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPredictions:
 *                       type: integer
 *                     accuracyRate:
 *                       type: string
 *                     averageConfidence:
 *                       type: string
 *                     bySport:
 *                       type: object
 *                     recentPerformance:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    let stats = {
      totalPredictions: 0,
      accuracyRate: '0%',
      averageConfidence: '0%',
      bySport: {},
      recentPerformance: []
    };

    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      
      // Get total predictions count
      stats.totalPredictions = await db.collection('predictions')
        .countDocuments({ userId });

      // Get predictions by sport
      const bySport = await db.collection('predictions')
        .aggregate([
          { $match: { userId } },
          { $group: { _id: '$sport', count: { $sum: 1 } } }
        ]).toArray();
      
      stats.bySport = bySport.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      // Mock additional stats (in production, calculate from actual results)
      stats.accuracyRate = '68.5%';
      stats.averageConfidence = '72.3%';
      stats.recentPerformance = [
        { date: '2024-01-15', correct: 4, total: 6 },
        { date: '2024-01-14', correct: 3, total: 5 },
        { date: '2024-01-13', correct: 5, total: 8 }
      ];
    } else {
      // Mock stats if DB not connected
      stats = {
        totalPredictions: 42,
        accuracyRate: '71.4%',
        averageConfidence: '73.2%',
        bySport: { NBA: 35, NFL: 7 },
        recentPerformance: [
          { date: new Date().toISOString().split('T')[0], correct: 3, total: 4 }
        ],
        note: 'Mock statistics - database connection required for real data'
      };
    }

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching prediction stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prediction statistics'
    });
  }
});

export default router;
