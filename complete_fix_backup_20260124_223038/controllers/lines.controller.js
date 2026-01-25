// controllers/lines.controller.js
import Analytics from '../models/analytics.js';

// Get current lines
export const getLines = async (req, res) => {
  try {
    const { sport, type, player } = req.query;

    // Mock data - in real app, this would come from a sports data API
    const mockLines = [
      {
        id: '1',
        sport: 'NBA',
        player: 'Luka Dončić',
        team: 'DAL',
        lineType: 'points',
        currentLine: 32.5,
        openingLine: 31.5,
        movement: '+1.0',
        odds: '-145',
        lastUpdated: new Date()
      },
      {
        id: '2',
        sport: 'NBA',
        player: 'Nikola Jokić',
        team: 'DEN',
        lineType: 'assists',
        currentLine: 9.5,
        openingLine: 8.5,
        movement: '+1.0',
        odds: '-120',
        lastUpdated: new Date()
      },
      {
        id: '3',
        sport: 'NFL',
        player: 'Christian McCaffrey',
        team: 'SF',
        lineType: 'rushing_yards',
        currentLine: 115.5,
        openingLine: 110.5,
        movement: '+5.0',
        odds: '-155',
        lastUpdated: new Date()
      }
    ];

    // Filter based on query
    let filteredLines = mockLines;
    if (sport && sport !== 'all') {
      filteredLines = filteredLines.filter(line => line.sport === sport);
    }
    if (type && type !== 'all') {
      filteredLines = filteredLines.filter(line => line.lineType.includes(type));
    }
    if (player) {
      filteredLines = filteredLines.filter(line => 
        line.player.toLowerCase().includes(player.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: {
        lines: filteredLines,
        lastUpdated: new Date(),
        source: 'SportsData API'
      }
    });
  } catch (error) {
    console.error('Get lines error:', error);
    res.status(500).json({ success: false, message: 'Failed to get lines', error: error.message });
  }
};

// Get line history
export const getLineHistory = async (req, res) => {
  try {
    const { sport, player, days = 7 } = req.query;

    // Mock historical data
    const history = [
      {
        date: '2024-01-24',
        sport: 'NBA',
        player: 'Luka Dončić',
        lineType: 'points',
        openingLine: 31.5,
        closingLine: 32.5,
        movement: '+1.0',
        result: 34,
        hit: true
      },
      {
        date: '2024-01-23',
        sport: 'NBA',
        player: 'Nikola Jokić',
        lineType: 'assists',
        openingLine: 8.5,
        closingLine: 9.5,
        movement: '+1.0',
        result: 11,
        hit: true
      },
      {
        date: '2024-01-22',
        sport: 'NFL',
        player: 'Christian McCaffrey',
        lineType: 'rushing_yards',
        openingLine: 110.5,
        closingLine: 115.5,
        movement: '+5.0',
        result: 125,
        hit: true
      }
    ];

    // Filter based on query
    let filteredHistory = history;
    if (sport && sport !== 'all') {
      filteredHistory = filteredHistory.filter(item => item.sport === sport);
    }
    if (player) {
      filteredHistory = filteredHistory.filter(item => 
        item.player.toLowerCase().includes(player.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: {
        history: filteredHistory,
        analysis: {
          totalEntries: filteredHistory.length,
          hitRate: filteredHistory.length > 0 
            ? (filteredHistory.filter(item => item.hit).length / filteredHistory.length * 100).toFixed(2)
            : '0.00',
          averageMovement: filteredHistory.length > 0
            ? (filteredHistory.reduce((sum, item) => {
                const move = parseFloat(item.movement);
                return sum + (isNaN(move) ? 0 : move);
              }, 0) / filteredHistory.length).toFixed(2)
            : '0.00'
        }
      }
    });
  } catch (error) {
    console.error('Line history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get line history', error: error.message });
  }
};

// Compare lines across books
export const compareLines = async (req, res) => {
  try {
    const { sport, player, lineType } = req.query;

    // Mock comparison data
    const comparison = {
      player: player || 'Luka Dončić',
      sport: sport || 'NBA',
      lineType: lineType || 'points',
      books: [
        {
          book: 'PrizePicks',
          line: 32.5,
          odds: '-145',
          lastUpdated: new Date()
        },
        {
          book: 'DraftKings',
          line: 32.0,
          odds: '-130',
          lastUpdated: new Date(Date.now() - 300000) // 5 minutes ago
        },
        {
          book: 'FanDuel',
          line: 32.0,
          odds: '-125',
          lastUpdated: new Date(Date.now() - 600000) // 10 minutes ago
        },
        {
          book: 'BetMGM',
          line: 31.5,
          odds: '-110',
          lastUpdated: new Date(Date.now() - 900000) // 15 minutes ago
        }
      ],
      analysis: {
        bestValue: 'PrizePicks',
        averageLine: 32.0,
        standardDeviation: 0.41,
        edgeScore: 8.2
      }
    };

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Compare lines error:', error);
    res.status(500).json({ success: false, message: 'Failed to compare lines', error: error.message });
  }
};

// Get line alerts
export const getLineAlerts = async (req, res) => {
  try {
    const { userId } = req.user;
    const { activeOnly = true } = req.query;

    // Mock alerts
    const alerts = [
      {
        id: '1',
        player: 'Luka Dončić',
        sport: 'NBA',
        lineType: 'points',
        targetLine: 32.5,
        currentLine: 32.0,
        condition: 'above',
        triggered: false,
        created: new Date(Date.now() - 86400000), // 1 day ago
        expires: new Date(Date.now() + 86400000) // 1 day from now
      },
      {
        id: '2',
        player: 'Nikola Jokić',
        sport: 'NBA',
        lineType: 'assists',
        targetLine: 9.5,
        currentLine: 9.5,
        condition: 'below',
        triggered: true,
        triggeredAt: new Date(Date.now() - 3600000), // 1 hour ago
        created: new Date(Date.now() - 172800000), // 2 days ago
        expires: new Date(Date.now() + 86400000)
      }
    ];

    let filteredAlerts = alerts;
    if (activeOnly) {
      filteredAlerts = filteredAlerts.filter(alert => !alert.triggered && new Date(alert.expires) > new Date());
    }

    res.json({
      success: true,
      data: {
        alerts: filteredAlerts,
        stats: {
          total: alerts.length,
          active: alerts.filter(a => !a.triggered && new Date(a.expires) > new Date()).length,
          triggered: alerts.filter(a => a.triggered).length,
          expired: alerts.filter(a => new Date(a.expires) <= new Date()).length
        }
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to get line alerts', error: error.message });
  }
};

// Create line alert
export const createLineAlert = async (req, res) => {
  try {
    const { userId } = req.user;
    const { player, sport, lineType, targetLine, condition, expiresInHours = 24 } = req.body;

    // Validate input
    if (!player || !sport || !lineType || !targetLine || !condition) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: player, sport, lineType, targetLine, condition' 
      });
    }

    // Create alert
    const expires = new Date();
    expires.setHours(expires.getHours() + expiresInHours);

    const alert = {
      id: `alert_${Date.now()}`,
      userId,
      player,
      sport,
      lineType,
      targetLine,
      condition,
      triggered: false,
      created: new Date(),
      expires
    };

    // Log creation
    await Analytics.create({
      userId,
      eventType: 'line_alert_created',
      eventData: alert,
      metadata: { timestamp: new Date() }
    });

    res.status(201).json({
      success: true,
      message: 'Line alert created successfully',
      data: alert
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ success: false, message: 'Failed to create line alert', error: error.message });
  }
};

// Delete line alert
export const deleteLineAlert = async (req, res) => {
  try {
    const { userId } = req.user;
    const { alertId } = req.params;

    // Log deletion
    await Analytics.create({
      userId,
      eventType: 'line_alert_deleted',
      eventData: { alertId },
      metadata: { timestamp: new Date() }
    });

    res.json({
      success: true,
      message: 'Line alert deleted successfully'
    });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete line alert', error: error.message });
  }
};

// Get line movement trends
export const getLineMovementTrends = async (req, res) => {
  try {
    const { sport, timeframe = '7d' } = req.query;

    // Mock trend data
    const trends = [
      {
        date: '2024-01-24',
        sport: 'NBA',
        totalMovements: 42,
        averageMovement: 1.2,
        upwardMovements: 28,
        downwardMovements: 14,
        mostActivePlayer: 'Luka Dončić'
      },
      {
        date: '2024-01-23',
        sport: 'NBA',
        totalMovements: 38,
        averageMovement: 0.9,
        upwardMovements: 22,
        downwardMovements: 16,
        mostActivePlayer: 'Nikola Jokić'
      },
      {
        date: '2024-01-22',
        sport: 'NFL',
        totalMovements: 35,
        averageMovement: 2.1,
        upwardMovements: 20,
        downwardMovements: 15,
        mostActivePlayer: 'Christian McCaffrey'
      }
    ];

    let filteredTrends = trends;
    if (sport && sport !== 'all') {
      filteredTrends = filteredTrends.filter(trend => trend.sport === sport);
    }

    // Limit by timeframe
    if (timeframe === '24h') {
      filteredTrends = filteredTrends.slice(0, 1);
    }

    res.json({
      success: true,
      data: {
        trends: filteredTrends,
        summary: {
          totalDays: filteredTrends.length,
          averageDailyMovements: filteredTrends.length > 0
            ? (filteredTrends.reduce((sum, trend) => sum + trend.totalMovements, 0) / filteredTrends.length).toFixed(2)
            : '0.00',
          netMovement: filteredTrends.length > 0
            ? filteredTrends.reduce((sum, trend) => sum + (trend.upwardMovements - trend.downwardMovements), 0)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ success: false, message: 'Failed to get line movement trends', error: error.message });
  }
};

// ========== NEW FUNCTIONS FOR ROUTES ==========

// Line Discrepancies
export const getLineDiscrepancies = async (req, res) => {
  try {
    const { sport, limit = 10 } = req.query;
    
    // Mock discrepancies data
    const discrepancies = [
      {
        id: '1',
        player: 'Luka Dončić',
        sport: 'NBA',
        lineType: 'points',
        discrepancy: 2.5,
        book1: { name: 'PrizePicks', line: 32.5 },
        book2: { name: 'BetMGM', line: 30.0 },
        edge: 8.3,
        lastUpdated: new Date()
      },
      {
        id: '2',
        player: 'Nikola Jokić',
        sport: 'NBA',
        lineType: 'assists',
        discrepancy: 1.5,
        book1: { name: 'DraftKings', line: 9.5 },
        book2: { name: 'FanDuel', line: 8.0 },
        edge: 6.7,
        lastUpdated: new Date()
      },
      {
        id: '3',
        player: 'Christian McCaffrey',
        sport: 'NFL',
        lineType: 'rushing_yards',
        discrepancy: 7.5,
        book1: { name: 'PrizePicks', line: 115.5 },
        book2: { name: 'BetMGM', line: 108.0 },
        edge: 12.1,
        lastUpdated: new Date()
      }
    ];

    let filteredDiscrepancies = discrepancies;
    if (sport && sport !== 'all') {
      filteredDiscrepancies = filteredDiscrepancies.filter(d => d.sport === sport);
    }

    // Sort by highest discrepancy
    filteredDiscrepancies.sort((a, b) => b.discrepancy - a.discrepancy);
    
    // Apply limit
    filteredDiscrepancies = filteredDiscrepancies.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        discrepancies: filteredDiscrepancies,
        stats: {
          count: filteredDiscrepancies.length,
          averageDiscrepancy: filteredDiscrepancies.length > 0
            ? (filteredDiscrepancies.reduce((sum, d) => sum + d.discrepancy, 0) / filteredDiscrepancies.length).toFixed(2)
            : '0.00',
          maxDiscrepancy: filteredDiscrepancies.length > 0
            ? Math.max(...filteredDiscrepancies.map(d => d.discrepancy))
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Get line discrepancies error:', error);
    res.status(500).json({ success: false, message: 'Failed to get line discrepancies', error: error.message });
  }
};

export const getTopDiscrepancies = async (req, res) => {
  try {
    // Mock top discrepancies
    const topDiscrepancies = [
      {
        id: '1',
        player: 'Luka Dončić',
        sport: 'NBA',
        discrepancy: 2.5,
        edge: 8.3,
        opportunity: 'High'
      },
      {
        id: '2',
        player: 'Christian McCaffrey',
        sport: 'NFL',
        discrepancy: 7.5,
        edge: 12.1,
        opportunity: 'Very High'
      },
      {
        id: '3',
        player: 'Nikola Jokić',
        sport: 'NBA',
        discrepancy: 1.5,
        edge: 6.7,
        opportunity: 'Medium'
      }
    ];

    res.json({
      success: true,
      data: {
        topDiscrepancies,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Get top discrepancies error:', error);
    res.status(500).json({ success: false, message: 'Failed to get top discrepancies', error: error.message });
  }
};

export const getSportDiscrepancies = async (req, res) => {
  try {
    const { sport } = req.params;
    
    // Mock sport-specific discrepancies
    const discrepancies = {
      NBA: [
        {
          player: 'Luka Dončić',
          lineType: 'points',
          discrepancy: 2.5
        },
        {
          player: 'Nikola Jokić',
          lineType: 'assists',
          discrepancy: 1.5
        }
      ],
      NFL: [
        {
          player: 'Christian McCaffrey',
          lineType: 'rushing_yards',
          discrepancy: 7.5
        }
      ]
    };

    const sportData = discrepancies[sport] || [];

    res.json({
      success: true,
      data: {
        sport,
        discrepancies: sportData,
        count: sportData.length
      }
    });
  } catch (error) {
    console.error('Get sport discrepancies error:', error);
    res.status(500).json({ success: false, message: 'Failed to get sport discrepancies', error: error.message });
  }
};

// Player Line Analysis
export const getPlayerLines = async (req, res) => {
  try {
    const { playerId } = req.params;
    
    // Mock player lines
    const playerLines = {
      playerId,
      playerName: playerId === '123' ? 'Luka Dončić' : 'Player ' + playerId,
      sport: 'NBA',
      currentLines: [
        {
          lineType: 'points',
          line: 32.5,
          odds: '-145',
          book: 'PrizePicks'
        },
        {
          lineType: 'assists',
          line: 9.5,
          odds: '-120',
          book: 'PrizePicks'
        },
        {
          lineType: 'rebounds',
          line: 8.5,
          odds: '-110',
          book: 'PrizePicks'
        }
      ],
      seasonAverages: {
        points: 33.6,
        assists: 9.2,
        rebounds: 8.6
      },
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: playerLines
    });
  } catch (error) {
    console.error('Get player lines error:', error);
    res.status(500).json({ success: false, message: 'Failed to get player lines', error: error.message });
  }
};

export const getPlayerLineHistory = async (req, res) => {
  try {
    const { playerId } = req.params;
    
    // Mock player line history
    const history = [
      {
        date: '2024-01-24',
        lineType: 'points',
        openingLine: 31.5,
        closingLine: 32.5,
        result: 34,
        hit: true
      },
      {
        date: '2024-01-23',
        lineType: 'points',
        openingLine: 30.5,
        closingLine: 31.0,
        result: 28,
        hit: false
      },
      {
        date: '2024-01-22',
        lineType: 'assists',
        openingLine: 8.5,
        closingLine: 9.0,
        result: 11,
        hit: true
      }
    ];

    res.json({
      success: true,
      data: {
        playerId,
        history,
        stats: {
          totalGames: history.length,
          hitRate: (history.filter(h => h.hit).length / history.length * 100).toFixed(2),
          averageMovement: 1.2
        }
      }
    });
  } catch (error) {
    console.error('Get player line history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get player line history', error: error.message });
  }
};

export const getPlayerComparison = async (req, res) => {
  try {
    const { playerId } = req.params;
    
    // Mock player comparison
    const comparison = {
      playerId,
      playerName: 'Luka Dončić',
      comparisons: [
        {
          comparisonType: 'vsSeasonAverage',
          lineType: 'points',
          currentLine: 32.5,
          seasonAverage: 33.6,
          difference: -1.1,
          edge: 3.2
        },
        {
          comparisonType: 'vsLast5Average',
          lineType: 'points',
          currentLine: 32.5,
          last5Average: 35.2,
          difference: -2.7,
          edge: 8.1
        },
        {
          comparisonType: 'vsOpponentAverage',
          lineType: 'points',
          currentLine: 32.5,
          opponentAverageAllowed: 34.1,
          difference: -1.6,
          edge: 4.8
        }
      ]
    };

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Get player comparison error:', error);
    res.status(500).json({ success: false, message: 'Failed to get player comparison', error: error.message });
  }
};

// Custom Line Analysis
export const analyzeCustomLines = async (req, res) => {
  try {
    const { player, sport, lineType, lineValue } = req.body;

    if (!player || !sport || !lineType || lineValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: player, sport, lineType, lineValue'
      });
    }

    // Mock analysis
    const analysis = {
      player,
      sport,
      lineType,
      lineValue,
      analysis: {
        valueRating: 'Good Value',
        confidence: 75,
        recommendation: 'Consider Playing',
        factors: [
          {
            factor: 'Season Average Comparison',
            score: 8,
            description: 'Line is 1.1 points below season average'
          },
          {
            factor: 'Recent Form',
            score: 7,
            description: 'Player has exceeded this line in 4 of last 5 games'
          },
          {
            factor: 'Matchup Analysis',
            score: 6,
            description: 'Opponent ranks 15th in defensive efficiency'
          }
        ]
      }
    };

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Analyze custom lines error:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze custom lines', error: error.message });
  }
};

export const validateLine = async (req, res) => {
  try {
    const { player, sport, lineType, lineValue } = req.body;

    if (!player || !sport || !lineType || lineValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: player, sport, lineType, lineValue'
      });
    }

    // Mock validation
    const validation = {
      isValid: true,
      reasons: [
        'Line is within historical range for this player',
        'Player has active status',
        'Game is scheduled within next 48 hours'
      ],
      warnings: lineValue > 50 ? ['Line value seems unusually high'] : [],
      suggestions: [
        'Consider comparing with other sportsbooks',
        'Check player injury status closer to game time'
      ]
    };

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Validate line error:', error);
    res.status(500).json({ success: false, message: 'Failed to validate line', error: error.message });
  }
};

// Edge Calculation
export const calculateEdge = async (req, res) => {
  try {
    const { player, sport, lineType, lineValue, odds } = req.query;

    if (!player || !sport || !lineType || lineValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: player, sport, lineType, lineValue'
      });
    }

    // Mock edge calculation
    const lineNum = parseFloat(lineValue);
    const edgeCalculation = {
      player,
      sport,
      lineType,
      lineValue: lineNum,
      odds: odds || '-110',
      edge: 6.5,
      probability: 54.3,
      expectedValue: 0.12,
      recommendation: edgeCalculation.edge > 5 ? 'Positive Edge' : 'Neutral',
      calculation: {
        impliedProbability: 52.4,
        estimatedProbability: 58.9,
        edge: 6.5
      }
    };

    res.json({
      success: true,
      data: edgeCalculation
    });
  } catch (error) {
    console.error('Calculate edge error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate edge', error: error.message });
  }
};

export const getTopEdgeOpportunities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Mock top edge opportunities
    const opportunities = [
      {
        player: 'Luka Dončić',
        sport: 'NBA',
        lineType: 'points',
        edge: 8.3,
        line: 32.5,
        odds: '-145',
        confidence: 'High'
      },
      {
        player: 'Christian McCaffrey',
        sport: 'NFL',
        lineType: 'rushing_yards',
        edge: 12.1,
        line: 115.5,
        odds: '-155',
        confidence: 'Very High'
      },
      {
        player: 'Nikola Jokić',
        sport: 'NBA',
        lineType: 'assists',
        edge: 6.7,
        line: 9.5,
        odds: '-120',
        confidence: 'Medium'
      }
    ];

    // Apply limit
    const limitedOpportunities = opportunities.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        opportunities: limitedOpportunities,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Get top edge opportunities error:', error);
    res.status(500).json({ success: false, message: 'Failed to get top edge opportunities', error: error.message });
  }
};

export const getSportEdgeOpportunities = async (req, res) => {
  try {
    const { sport } = req.params;
    
    // Mock sport-specific edge opportunities
    const opportunities = {
      NBA: [
        {
          player: 'Luka Dončić',
          edge: 8.3,
          lineType: 'points'
        },
        {
          player: 'Nikola Jokić',
          edge: 6.7,
          lineType: 'assists'
        }
      ],
      NFL: [
        {
          player: 'Christian McCaffrey',
          edge: 12.1,
          lineType: 'rushing_yards'
        }
      ]
    };

    const sportOpportunities = opportunities[sport] || [];

    res.json({
      success: true,
      data: {
        sport,
        opportunities: sportOpportunities,
        averageEdge: sportOpportunities.length > 0
          ? (sportOpportunities.reduce((sum, o) => sum + o.edge, 0) / sportOpportunities.length).toFixed(2)
          : '0.00'
      }
    });
  } catch (error) {
    console.error('Get sport edge opportunities error:', error);
    res.status(500).json({ success: false, message: 'Failed to get sport edge opportunities', error: error.message });
  }
};

// Real-time Line Monitoring
export const monitorLine = async (req, res) => {
  try {
    const { lineId } = req.params;
    
    // Mock line monitoring
    const monitoring = {
      lineId,
      status: 'active',
      currentValue: 32.5,
      lastMovement: '+0.5',
      movementTime: new Date(Date.now() - 300000), // 5 minutes ago
      books: [
        {
          book: 'PrizePicks',
          value: 32.5,
          lastUpdated: new Date()
        },
        {
          book: 'DraftKings',
          value: 32.0,
          lastUpdated: new Date(Date.now() - 180000) // 3 minutes ago
        }
      ],
      alerts: [
        {
          type: 'movement',
          threshold: 1.0,
          triggered: false
        }
      ]
    };

    res.json({
      success: true,
      data: monitoring
    });
  } catch (error) {
    console.error('Monitor line error:', error);
    res.status(500).json({ success: false, message: 'Failed to monitor line', error: error.message });
  }
};

export const setLineAlert = async (req, res) => {
  try {
    const { userId } = req.user;
    const { lineId, condition, threshold, notificationType } = req.body;

    if (!lineId || !condition || !threshold) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: lineId, condition, threshold'
      });
    }

    // Mock alert creation
    const alert = {
      id: `line_alert_${Date.now()}`,
      lineId,
      userId,
      condition,
      threshold,
      notificationType: notificationType || 'email',
      active: true,
      created: new Date(),
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    // Log to analytics
    await Analytics.create({
      userId,
      eventType: 'line_monitoring_alert_created',
      eventData: alert,
      metadata: { timestamp: new Date() }
    });

    res.status(201).json({
      success: true,
      message: 'Line monitoring alert created successfully',
      data: alert
    });
  } catch (error) {
    console.error('Set line alert error:', error);
    res.status(500).json({ success: false, message: 'Failed to set line alert', error: error.message });
  }
};

// Add this at the very end of the file, after all the exports
export default {
  getLines,
  getLineHistory,
  compareLines,
  getLineAlerts,
  createLineAlert,
  deleteLineAlert,
  getLineMovementTrends,
  getLineDiscrepancies,
  getTopDiscrepancies,
  getSportDiscrepancies,
  getPlayerLines,
  getPlayerLineHistory,
  getPlayerComparison,
  analyzeCustomLines,
  validateLine,
  calculateEdge,
  getTopEdgeOpportunities,
  getSportEdgeOpportunities,
  monitorLine,
  setLineAlert
};
