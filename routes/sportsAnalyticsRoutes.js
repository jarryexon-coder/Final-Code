import express from 'express';
import SportsBettingAnalyticsService from '../services/SportsBettingAnalyticsService.js';

const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "sportsAnalytics API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

/**
 * @swagger
 * /api/sports-analytics/match/analytics:
 *   get:
 *     summary: Get match analytics for upcoming games
 *     description: Retrieve detailed analytics for upcoming matches including predictions, win probabilities, and betting insights
 *     tags: [Sports Analytics]
 *     responses:
 *       200:
 *         description: Match analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analytics:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MatchAnalytics'
 *                 generatedAt:
 *                   type: string
 *                 sport:
 *                   type: string
 *                 week:
 *                   type: string
 *                 totalMatches:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/match/analytics', async (req, res) => {
  try {
    console.log('📈 Fetching match analytics...');
    
    const analytics = [
      {
        matchId: "nfl-2024-wc-1",
        homeTeam: "Chiefs",
        awayTeam: "Dolphins",
        date: "2024-01-13",
        time: "20:00",
        venue: "Arrowhead Stadium",
        predictedWinner: "Chiefs",
        winProbability: 0.72,
        predictedScore: "27-21",
        weather: {
          temperature: 18,
          condition: "Cold",
          wind: "12 mph",
          precipitation: "10%"
        },
        keyInsights: [
          "Chiefs defense ranks 2nd against the pass",
          "Dolphins struggling on the road in cold weather",
          "Patrick Mahomes has 8-2 record in playoffs",
          "Tyreek Hill averages 112 YPG vs former team"
        ],
        trends: {
          overUnder: {
            line: 46.5,
            recommendation: "Under",
            confidence: 0.65,
            reasoning: "Both teams have strong defenses in cold weather"
          },
          spread: {
            line: -4.5,
            team: "Chiefs",
            recommendation: "Chiefs -4.5",
            confidence: 0.68,
            reasoning: "Chiefs have covered 7 of last 10 at home"
          },
          moneyline: {
            home: -210,
            away: +175,
            recommendation: "Chiefs ML",
            confidence: 0.72,
            reasoning: "Mahomes playoff experience is decisive"
          }
        }
      },
      {
        matchId: "nfl-2024-wc-2",
        homeTeam: "Bills",
        awayTeam: "Steelers",
        date: "2024-01-14",
        time: "13:00",
        venue: "Highmark Stadium",
        predictedWinner: "Bills",
        winProbability: 0.78,
        predictedScore: "31-17",
        weather: {
          temperature: 24,
          condition: "Snow Flurries",
          wind: "15 mph",
          precipitation: "40%"
        },
        keyInsights: [
          "Bills are 6-1 at home this season",
          "Steelers offense ranks 28th in yards per game",
          "Josh Allen has 24 TD passes at home",
          "Steelers 1-4 vs playoff teams this season"
        ],
        trends: {
          overUnder: {
            line: 48.5,
            recommendation: "Over",
            confidence: 0.61,
            reasoning: "Bills offense averages 28 PPG at home"
          },
          spread: {
            line: -10,
            team: "Bills",
            recommendation: "Bills -10",
            confidence: 0.58,
            reasoning: "Bills have won last 3 home games by 14+"
          },
          moneyline: {
            home: -450,
            away: +350,
            recommendation: "Bills ML",
            confidence: 0.78,
            reasoning: "Massive home field advantage in cold"
          }
        }
      },
      {
        matchId: "nfl-2024-wc-3",
        homeTeam: "49ers",
        awayTeam: "Packers",
        date: "2024-01-15",
        time: "20:15",
        venue: "Levi's Stadium",
        predictedWinner: "49ers",
        winProbability: 0.81,
        predictedScore: "30-20",
        weather: {
          temperature: 52,
          condition: "Partly Cloudy",
          wind: "8 mph",
          precipitation: "0%"
        },
        keyInsights: [
          "49ers are 7-1 at home this season",
          "Christian McCaffrey leads NFL in scrimmage yards",
          "Packers have won 4 straight but all at home",
          "49ers defense allows only 17.5 PPG at home"
        ],
        trends: {
          overUnder: {
            line: 50.5,
            recommendation: "Over",
            confidence: 0.67,
            reasoning: "Both offenses in top 10 for scoring"
          },
          spread: {
            line: -9.5,
            team: "49ers",
            recommendation: "49ers -9.5",
            confidence: 0.63,
            reasoning: "49ers have covered 6 of last 7 at home"
          },
          moneyline: {
            home: -400,
            away: +320,
            recommendation: "49ers ML",
            confidence: 0.81,
            reasoning: "Complete team advantage for 49ers"
          }
        }
      }
    ];

    res.json({
      success: true,
      analytics: analytics,
      generatedAt: new Date().toISOString(),
      sport: "NFL",
      week: "Wild Card",
      totalMatches: analytics.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching match analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch match analytics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/sports-analytics/advanced/analytics:
 *   get:
 *     summary: Get advanced player analytics
 *     description: Retrieve comprehensive advanced analytics for top players including metrics, trends, and player value
 *     tags: [Sports Analytics]
 *     responses:
 *       200:
 *         description: Advanced player analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analytics:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdvancedPlayerAnalytics'
 *                 updatedAt:
 *                   type: string
 *                 sport:
 *                   type: string
 *                 season:
 *                   type: string
 *                 totalPlayers:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/advanced/analytics', async (req, res) => {
  try {
    console.log('📊 Fetching advanced analytics...');
    
    const analytics = [
      {
        playerId: "patrick-mahomes",
        name: "Patrick Mahomes",
        team: "Chiefs",
        position: "QB",
        image: "https://static.www.nfl.com/image/upload/t_headshot_desktop/f_auto/league/hcf8qklwj4nwqzhvlqvh",
        metrics: {
          qbr: 72.3,
          epaPerPlay: 0.21,
          successRate: 0.54,
          completionPercentageOverExpected: 4.2,
          airYardsPerAttempt: 8.1,
          passerRating: 105.4,
          totalQBR: 78.2
        },
        advancedStats: {
          pressureToSackRatio: 0.18,
          bigTimeThrowRate: 0.063,
          turnoverWorthyPlayRate: 0.025,
          passerRatingUnderPressure: 90.2,
          adjustedCompletionPercentage: 78.3,
          cleanPocketRating: 115.6,
          blitzRating: 108.3
        },
        trends: {
          last5Games: [72.1, 74.3, 68.9, 79.2, 71.5],
          seasonHigh: 84.2,
          seasonLow: 61.5,
          homeVsAway: {
            home: { qbr: 75.1, rating: 108.2 },
            away: { qbr: 69.8, rating: 102.7 }
          }
        },
        playerValue: {
          war: 4.8,
          vorp: 3.2,
          marketValue: "$45M"
        }
      },
      {
        playerId: "tyreek-hill",
        name: "Tyreek Hill",
        team: "Dolphins",
        position: "WR",
        image: "https://static.www.nfl.com/image/upload/t_headshot_desktop/f_auto/league/x9tkgkfknpcofqq7zq6j",
        metrics: {
          yardsPerRouteRun: 2.85,
          targetShare: 0.32,
          airYardsShare: 0.42,
          catchRate: 0.71,
          yardsAfterCatchPerReception: 6.8,
          dropRate: 0.028,
          contestedCatchRate: 0.58
        },
        advancedStats: {
          separationYards: 2.3,
          passerRatingWhenTargeted: 127.4,
          deepTargetRate: 0.28,
          slotVsWide: {
            slot: { targets: 45, yards: 512, tds: 4 },
            wide: { targets: 112, yards: 1345, tds: 9 }
          },
          routeParticipation: 0.94
        },
        trends: {
          last5Games: [112, 99, 81, 157, 120],
          seasonHigh: 181,
          seasonLow: 58,
          vsManCoverage: { targets: 68, yards: 845, tds: 7 },
          vsZoneCoverage: { targets: 89, yards: 1012, tds: 6 }
        },
        playerValue: {
          war: 3.9,
          vorp: 2.8,
          marketValue: "$30M"
        }
      },
      {
        playerId: "christian-mccaffrey",
        name: "Christian McCaffrey",
        team: "49ers",
        position: "RB",
        image: "https://static.www.nfl.com/image/upload/t_headshot_desktop/f_auto/league/ngwezbfkpiobnnypzntl",
        metrics: {
          yardsPerRouteRun: 1.42,
          targetShare: 0.18,
          yardsPerCarry: 5.4,
          breakawayRunRate: 0.12,
          evadedTackles: 78,
          yardsAfterContact: 892
        },
        advancedStats: {
          passBlockEfficiency: 0.92,
          runBlockingGrade: 78.4,
          elusivenessRating: 92.1,
          receivingGrade: 89.3,
          rushingGrade: 91.7
        },
        trends: {
          last5Games: [145, 128, 94, 163, 112],
          seasonHigh: 189,
          seasonLow: 67,
          byDown: {
            first: { attempts: 112, yards: 589, avg: 5.3 },
            second: { attempts: 98, yards: 512, avg: 5.2 },
            third: { attempts: 45, yards: 278, avg: 6.2 }
          }
        },
        playerValue: {
          war: 4.2,
          vorp: 3.1,
          marketValue: "$16M"
        }
      }
    ];

    res.json({
      success: true,
      analytics: analytics,
      updatedAt: new Date().toISOString(),
      sport: "NFL",
      season: "2024",
      totalPlayers: analytics.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching advanced analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advanced analytics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/sports-analytics/arbitrage:
 *   get:
 *     summary: Find arbitrage betting opportunities
 *     description: Identify potential arbitrage situations across different sportsbooks
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to analyze for arbitrage opportunities
 *       - in: query
 *         name: marketType
 *         schema:
 *           type: string
 *           enum: [moneyline, pointspread, totals]
 *         description: Type of betting market to analyze
 *     responses:
 *       200:
 *         description: List of arbitrage opportunities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ArbitrageOpportunity'
 *       500:
 *         description: Server error
 */
router.get('/arbitrage', async (req, res) => {
  try {
    const { sport, marketType } = req.query;
    
    const opportunities = await SportsBettingAnalyticsService.findArbitrageOpportunities(
      sport,
      marketType
    );
    
    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    console.error('❌ Error finding arbitrage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/sharp-money:
 *   get:
 *     summary: Track sharp money movements
 *     description: Monitor betting line movements from professional bettors
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to track sharp money for
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: string
 *           default: '24h'
 *           enum: [1h, 6h, 12h, 24h, 48h, 72h]
 *         description: Time window for analysis
 *     responses:
 *       200:
 *         description: Sharp money movement data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SharpMoneyMovement'
 *       500:
 *         description: Server error
 */
router.get('/sharp-money', async (req, res) => {
  try {
    const { sport, timeWindow = '24h' } = req.query;
    
    const sharpMoves = await SportsBettingAnalyticsService.trackSharpMoney(
      sport,
      timeWindow
    );
    
    res.json({
      success: true,
      data: sharpMoves
    });
  } catch (error) {
    console.error('❌ Error tracking sharp money:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/public-vs-sharp:
 *   get:
 *     summary: Analyze public vs sharp betting patterns
 *     description: Compare betting patterns between public bettors and professional sharps
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to analyze
 *     responses:
 *       200:
 *         description: Public vs sharp betting analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PublicSharpAnalysis'
 *       500:
 *         description: Server error
 */
router.get('/public-vs-sharp', async (req, res) => {
  try {
    const { sport } = req.query;
    
    const analysis = await SportsBettingAnalyticsService.analyzePublicVsSharp(sport);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('❌ Error analyzing public vs sharp:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/regression:
 *   get:
 *     summary: Find statistical regression candidates
 *     description: Identify teams or players due for statistical regression to the mean
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to analyze
 *       - in: query
 *         name: statType
 *         schema:
 *           type: string
 *           description: Statistical category to analyze (e.g., "shooting_percentage", "turnovers")
 *     responses:
 *       200:
 *         description: Regression candidate analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RegressionCandidate'
 *       500:
 *         description: Server error
 */
router.get('/regression', async (req, res) => {
  try {
    const { sport, statType } = req.query;
    
    const candidates = await SportsBettingAnalyticsService.findRegressionCandidates(
      sport,
      statType
    );
    
    res.json({
      success: true,
      data: candidates
    });
  } catch (error) {
    console.error('❌ Error finding regression candidates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/historical-trends:
 *   get:
 *     summary: Analyze historical betting trends
 *     description: Examine historical data to identify betting trends and patterns
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to analyze
 *       - in: query
 *         name: trendType
 *         schema:
 *           type: string
 *           enum: [team_trends, situation_trends, system_trends, player_trends]
 *         description: Type of trend to analyze
 *     responses:
 *       200:
 *         description: Historical trend analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/HistoricalTrends'
 *       500:
 *         description: Server error
 */
router.get('/historical-trends', async (req, res) => {
  try {
    const { sport, trendType } = req.query;
    
    const trends = await SportsBettingAnalyticsService.analyzeHistoricalTrends(
      sport,
      trendType
    );
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('❌ Error analyzing historical trends:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/expected-value:
 *   post:
 *     summary: Calculate expected value for bets
 *     description: Compute the mathematical expected value of a betting opportunity
 *     tags: [Sports Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - probability
 *               - odds
 *             properties:
 *               probability:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Probability of the bet winning (0-1)
 *               odds:
 *                 type: number
 *                 description: Decimal odds for the bet
 *               stake:
 *                 type: number
 *                 default: 100
 *                 description: Betting stake amount
 *     responses:
 *       200:
 *         description: Expected value calculation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ExpectedValue'
 *       400:
 *         description: Invalid input parameters
 *       500:
 *         description: Server error
 */
router.post('/expected-value', async (req, res) => {
  try {
    const { probability, odds, stake } = req.body;
    
    // Validate required fields
    if (probability === undefined || odds === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Probability and odds are required'
      });
    }
    
    const ev = SportsBettingAnalyticsService.calculateExpectedValue(
      probability,
      odds,
      stake
    );
    
    res.json({
      success: true,
      data: ev
    });
  } catch (error) {
    console.error('❌ Error calculating EV:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/games:
 *   get:
 *     summary: Get sports games data
 *     description: Retrieve list of sports games with analytics data
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to filter games
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, completed]
 *         description: Game status filter
 *     responses:
 *       200:
 *         description: List of games with analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GameWithAnalytics'
 *       500:
 *         description: Server error
 */
router.get('/games', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, date, status } = req.query;
    
    // This would typically call a service method that uses BALLDONTLIE_API_KEY
    // For example: await SportsAnalyticsService.getGamesWithAnalytics(sport, date, status);
    
    res.json({
      success: true,
      message: 'Games endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching games:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/games/{id}:
 *   get:
 *     summary: Get specific game analytics
 *     description: Retrieve detailed analytics for a specific game
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Detailed game analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GameDetailedAnalytics'
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Use BALLDONTLIE_API_KEY via service layer
    
    res.json({
      success: true,
      message: 'Game details endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching game details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/players:
 *   get:
 *     summary: Get players with analytics data
 *     description: Retrieve player data with advanced analytics metrics
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to filter players
 *       - in: query
 *         name: team_id
 *         schema:
 *           type: string
 *         description: Filter by team ID
 *       - in: query
 *         name: min_games
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Minimum games played filter
 *     responses:
 *       200:
 *         description: List of players with analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlayerAnalytics'
 *       500:
 *         description: Server error
 */
router.get('/players', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, team_id, min_games } = req.query;
    
    res.json({
      success: true,
      message: 'Players endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching players:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/teams:
 *   get:
 *     summary: Get teams with analytics data
 *     description: Retrieve team data with advanced analytics metrics
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to filter teams
 *       - in: query
 *         name: conference
 *         schema:
 *           type: string
 *         description: Filter by conference
 *     responses:
 *       200:
 *         description: List of teams with analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TeamAnalytics'
 *       500:
 *         description: Server error
 */
router.get('/teams', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, conference } = req.query;
    
    res.json({
      success: true,
      message: 'Teams endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/stats:
 *   get:
 *     summary: Get comprehensive sports statistics
 *     description: Retrieve detailed statistical data for analysis
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           enum: [nba, nfl, mlb, nhl]
 *         description: Sport to get stats for
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *         description: 'Season filter (format: YYYY-YY)'
 *       - in: query
 *         name: stat_type
 *         schema:
 *           type: string
 *           enum: [traditional, advanced, tracking, shooting, hustle]
 *         description: Type of statistics to retrieve
 *     responses:
 *       200:
 *         description: Statistical data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdvancedStats'
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req, res) => {
  try {
    // Use BALLDONTLIE_API_KEY via service layer
    const { sport, season, stat_type } = req.query;
    
    res.json({
      success: true,
      message: 'Stats endpoint - Integration with BALLDONTLIE_API_KEY pending'
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/predictions/game/{gameId}:
 *   get:
 *     summary: Get game predictions
 *     description: Retrieve AI-powered predictions for specific games
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *           default: 'ensemble'
 *           enum: ['ensemble', 'neural_network', 'random_forest', 'gradient_boosting']
 *         description: Prediction model to use
 *     responses:
 *       200:
 *         description: Game predictions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GamePrediction'
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/predictions/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { model } = req.query;
    // Use RAPIDAPI_KEY_PREDICTION via service layer
    
    res.json({
      success: true,
      message: 'Game predictions endpoint - Integration with RAPIDAPI_KEY_PREDICTION pending'
    });
  } catch (error) {
    console.error('❌ Error fetching game predictions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sports-analytics/predictions/player/{playerId}:
 *   get:
 *     summary: Get player performance predictions
 *     description: Retrieve AI-powered predictions for player performance
 *     tags: [Sports Analytics]
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID
 *       - in: query
 *         name: projection_type
 *         schema:
 *           type: string
 *           default: 'next_game'
 *           enum: ['next_game', 'rest_of_season', 'playoffs', 'career']
 *         description: Type of projection
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
 *                   $ref: '#/components/schemas/PlayerPrediction'
 *       404:
 *         description: Player not found
 *       500:
 *         description: Server error
 */
router.get('/predictions/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { projection_type } = req.query;
    // Use RAPIDAPI_KEY_PREDICTION via service layer
    
    res.json({
      success: true,
      message: 'Player predictions endpoint - Integration with RAPIDAPI_KEY_PREDICTION pending'
    });
  } catch (error) {
    console.error('❌ Error fetching player predictions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     MatchAnalytics:
 *       type: object
 *       properties:
 *         matchId:
 *           type: string
 *         homeTeam:
 *           type: string
 *         awayTeam:
 *           type: string
 *         date:
 *           type: string
 *         time:
 *           type: string
 *         venue:
 *           type: string
 *         predictedWinner:
 *           type: string
 *         winProbability:
 *           type: number
 *         predictedScore:
 *           type: string
 *         weather:
 *           type: object
 *           properties:
 *             temperature:
 *               type: integer
 *             condition:
 *               type: string
 *             wind:
 *               type: string
 *             precipitation:
 *               type: string
 *         keyInsights:
 *           type: array
 *           items:
 *             type: string
 *         trends:
 *           type: object
 *           properties:
 *             overUnder:
 *               type: object
 *               properties:
 *                 line:
 *                   type: number
 *                 recommendation:
 *                   type: string
 *                 confidence:
 *                   type: number
 *                 reasoning:
 *                   type: string
 *             spread:
 *               type: object
 *               properties:
 *                 line:
 *                   type: number
 *                 team:
 *                   type: string
 *                 recommendation:
 *                   type: string
 *                 confidence:
 *                   type: number
 *                 reasoning:
 *                   type: string
 *             moneyline:
 *               type: object
 *               properties:
 *                 home:
 *                   type: number
 *                 away:
 *                   type: number
 *                 recommendation:
 *                   type: string
 *                 confidence:
 *                   type: number
 *                 reasoning:
 *                   type: string
 *     
 *     AdvancedPlayerAnalytics:
 *       type: object
 *       properties:
 *         playerId:
 *           type: string
 *         name:
 *           type: string
 *         team:
 *           type: string
 *         position:
 *           type: string
 *         image:
 *           type: string
 *         metrics:
 *           type: object
 *           additionalProperties: true
 *         advancedStats:
 *           type: object
 *           additionalProperties: true
 *         trends:
 *           type: object
 *           additionalProperties: true
 *         playerValue:
 *           type: object
 *           properties:
 *             war:
 *               type: number
 *             vorp:
 *               type: number
 *             marketValue:
 *               type: string
 *     
 *     ArbitrageOpportunity:
 *       type: object
 *       properties:
 *         gameId:
 *           type: string
 *         sport:
 *           type: string
 *         market:
 *           type: string
 *         outcomes:
 *           type: array
 *           items:
 *             type: object
 *         profitMargin:
 *           type: number
 *         confidence:
 *           type: string
 *     
 *     SharpMoneyMovement:
 *       type: object
 *       properties:
 *         gameId:
 *           type: string
 *         market:
 *           type: string
 *         lineMovement:
 *           type: object
 *         sharpPercentage:
 *           type: number
 *         timeDetected:
 *           type: string
 *     
 *     PublicSharpAnalysis:
 *       type: object
 *       properties:
 *         gameId:
 *           type: string
 *         market:
 *           type: string
 *         publicPercentage:
 *           type: number
 *         sharpPercentage:
 *           type: number
 *         recommendation:
 *           type: string
 *     
 *     RegressionCandidate:
 *       type: object
 *       properties:
 *         entityId:
 *           type: string
 *         entityType:
 *           type: string
 *         stat:
 *           type: string
 *         currentValue:
 *           type: number
 *         expectedValue:
 *           type: number
 *         deviation:
 *           type: number
 *         confidence:
 *           type: string
 *     
 *     HistoricalTrends:
 *       type: object
 *       properties:
 *         trendType:
 *           type: string
 *         trendData:
 *           type: array
 *           items:
 *             type: object
 *         winRate:
 *           type: number
 *         sampleSize:
 *           type: integer
 *     
 *     ExpectedValue:
 *       type: object
 *       properties:
 *         probability:
 *           type: number
 *         odds:
 *           type: number
 *         stake:
 *           type: number
 *         expectedValue:
 *           type: number
 *         roi:
 *           type: number
 *         recommendation:
 *           type: string
 *     
 *     GameWithAnalytics:
 *       type: object
 *       properties:
 *         gameId:
 *           type: string
 *         homeTeam:
 *           type: string
 *         awayTeam:
 *           type: string
 *         date:
 *           type: string
 *         analytics:
 *           type: object
 *     
 *     GameDetailedAnalytics:
 *       type: object
 *       properties:
 *         gameId:
 *           type: string
 *         stats:
 *           type: object
 *         trends:
 *           type: object
 *         predictions:
 *           type: object
 *     
 *     PlayerAnalytics:
 *       type: object
 *       properties:
 *         playerId:
 *           type: string
 *         name:
 *           type: string
 *         advancedMetrics:
 *           type: object
 *     
 *     TeamAnalytics:
 *       type: object
 *       properties:
 *         teamId:
 *           type: string
 *         name:
 *           type: string
 *         advancedMetrics:
 *           type: object
 *     
 *     AdvancedStats:
 *       type: object
 *       properties:
 *         statType:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             type: object
 *     
 *     GamePrediction:
 *       type: object
 *       properties:
 *         gameId:
 *           type: string
 *         predictedWinner:
 *           type: string
 *         winProbability:
 *           type: number
 *         predictedScore:
 *           type: string
 *         confidence:
 *           type: number
 *     
 *     PlayerPrediction:
 *       type: object
 *       properties:
 *         playerId:
 *           type: string
 *         projectionType:
 *           type: string
 *         predictedStats:
 *           type: object
 *         confidence:
 *           type: number
 */

export default router;
