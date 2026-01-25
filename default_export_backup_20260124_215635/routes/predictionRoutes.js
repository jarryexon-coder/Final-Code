// routes/predictionsRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ====================
// PREDICTION GENERATION
// ====================

// POST /api/predictions/generate - Generate AI prediction
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

// GET /api/predictions/history - Get user's prediction history
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

// GET /api/predictions/:predictionId - Get specific prediction details
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

// POST /api/predictions/:predictionId/feedback - Submit feedback on prediction accuracy
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

// POST /api/predictions/batch - Generate predictions for multiple games
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

// GET /api/predictions/stats - Get prediction statistics
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
