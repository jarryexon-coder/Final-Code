// routes/newsRoutes.js - Updated to include NBA-specific news and trending sports news
import express from 'express';
const router = express.Router();
import axios from 'axios';

// In your newsRoutes.js, add this at the top:
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'News API is working',
    timestamp: new Date().toISOString(),
    news: []
  });
});

// Use your existing API keys from environment
const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY;
const THE_ODDS_API_KEY = process.env.THE_ODDS_API_KEY;
const RAPIDAPI_KEY_PLAYER_PROPS = process.env.RAPIDAPI_KEY_PLAYER_PROPS;
const RAPIDAPI_KEY_PREDICTIONS = process.env.RAPIDAPI_KEY_PREDICTIONS;
const NEWS_API_KEY = process.env.NEWS_API_KEY; // Added for News API integration

// ============= NEW ENDPOINTS WITH JSDOC ============= //

/**
 * @swagger
 * /api/news/nba:
 *   get:
 *     summary: Get NBA-specific news articles
 *     description: Retrieves the latest NBA news articles from News API, including team updates, player news, and game analyses. Searches across 150,000+ sources for NBA-related content [citation:2][citation:6].
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search keywords (e.g., "Los Angeles Lakers", "Stephen Curry")
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of articles to return (max 100) [citation:5]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevancy, popularity, publishedAt]
 *           default: publishedAt
 *         description: Sort order of articles [citation:6]
 *     responses:
 *       200:
 *         description: List of NBA news articles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 articles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       source:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       url:
 *                         type: string
 *                       urlToImage:
 *                         type: string
 *                       publishedAt:
 *                         type: string
 *                         format: date-time
 *                       content:
 *                         type: string
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Missing or invalid API key
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server error or News API unavailable
 */
router.get('/nba', async (req, res) => {
  // Use NEWS_API_KEY
  try {
    if (!NEWS_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'News API key not configured'
      });
    }

    const { q = 'NBA', pageSize = 20, sortBy = 'publishedAt' } = req.query;
    
    // Use News API's /v2/everything endpoint to search for NBA news [citation:2]
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        apiKey: NEWS_API_KEY,
        q: `${q} basketball`,
        language: 'en',
        pageSize: Math.min(parseInt(pageSize), 100),
        sortBy,
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 30 days
      }
    });

    // Filter and structure the response
    const articles = response.data.articles.map(article => ({
      source: article.source,
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      content: article.content?.substring(0, 200) // Truncate content
    }));

    res.json({
      success: true,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('NBA news API error:', error.message);
    
    // Handle different error scenarios
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'News API rate limit exceeded',
        message: 'Too many requests, please try again later'
      });
    }

    // Fallback to mock data if API fails
    res.json({
      success: true,
      count: 5,
      articles: getFallbackNBANews(),
      message: 'Using fallback NBA news data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/news/trending:
 *   get:
 *     summary: Get trending sports headlines
 *     description: Retrieves current top headlines across all major sports categories (NBA, NFL, NHL, MLB, etc.) using News API's top-headlines endpoint [citation:5].
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [sports, business, entertainment, health, science, technology]
 *           default: sports
 *         description: News category (defaults to sports) [citation:5]
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           default: us
 *         description: 2-letter country code for headlines
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 15
 *         description: Number of headlines to return
 *     responses:
 *       200:
 *         description: List of trending sports headlines
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 category:
 *                   type: string
 *                 country:
 *                   type: string
 *                 headlines:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       source:
 *                         type: string
 *                       sport:
 *                         type: string
 *                       url:
 *                         type: string
 *                       publishedAt:
 *                         type: string
 *                         format: date-time
 *                 timestamp:
 *                   type: string
 *       500:
 *         description: Server error or unable to fetch trending news
 */
router.get('/trending', async (req, res) => {
  // Use NEWS_API_KEY
  try {
    if (!NEWS_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'News API key not configured'
      });
    }

    const { category = 'sports', country = 'us', pageSize = 15 } = req.query;
    
    // Use News API's /v2/top-headlines endpoint for trending news [citation:5]
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        apiKey: NEWS_API_KEY,
        category,
        country,
        pageSize: Math.min(parseInt(pageSize), 100)
      }
    });

    // Process and categorize sports headlines
    const headlines = response.data.articles.map(article => {
      // Detect sport from headline content
      const title = article.title || '';
      let sport = 'General';
      
      if (title.match(/\b(NBA|basketball)\b/i)) sport = 'NBA';
      else if (title.match(/\b(NFL|football)\b/i)) sport = 'NFL';
      else if (title.match(/\b(NHL|hockey)\b/i)) sport = 'NHL';
      else if (title.match(/\b(MLB|baseball)\b/i)) sport = 'MLB';
      else if (title.match(/\b(soccer|EPL|Premier League)\b/i)) sport = 'Soccer';

      return {
        title: article.title,
        source: article.source?.name || 'Unknown',
        sport,
        url: article.url,
        publishedAt: article.publishedAt,
        description: article.description?.substring(0, 100)
      };
    });

    res.json({
      success: true,
      category,
      country,
      count: headlines.length,
      headlines,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Trending news API error:', error.message);
    
    // Fallback to combined data from existing APIs
    try {
      // Get data from existing endpoints as fallback
      const [latestNews, sportNews] = await Promise.all([
        axios.get(`${req.protocol}://${req.get('host')}/api/news/latest`).catch(() => null),
        axios.get(`${req.protocol}://${req.get('host')}/api/news/nba`).catch(() => null)
      ]);

      const fallbackHeadlines = [
        ...(latestNews?.data?.news?.slice(0, 5) || []).map(item => ({
          title: item.title,
          source: item.source,
          sport: item.sport || 'NBA',
          type: 'fallback',
          timestamp: item.timestamp
        })),
        ...(sportNews?.data?.articles?.slice(0, 5) || []).map(item => ({
          title: item.title,
          source: item.source?.name || 'News API',
          sport: 'NBA',
          type: 'fallback',
          timestamp: item.publishedAt
        }))
      ];

      res.json({
        success: true,
        category: 'sports',
        country: 'us',
        count: fallbackHeadlines.length,
        headlines: fallbackHeadlines.slice(0, 10),
        message: 'Using fallback trending news data',
        timestamp: new Date().toISOString()
      });
    } catch (fallbackError) {
      res.json({
        success: true,
        category: 'sports',
        country: 'us',
        count: 3,
        headlines: getFallbackTrendingNews(),
        message: 'Using static fallback data',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// ============= EXISTING ROUTES (with JSDoc added) ============= //

/**
 * @swagger
 * /api/news/latest:
 *   get:
 *     summary: Get latest combined sports news
 *     description: Aggregates news from multiple sports data sources including odds, predictions, and game schedules.
 *     tags: [News]
 *     responses:
 *       200:
 *         description: Combined news feed from multiple sports APIs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 news:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NewsItem'
 *                 count:
 *                   type: integer
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: string
 *                 timestamp:
 *                   type: string
 *       500:
 *         description: Server error, returns fallback data
 */
router.get('/latest', async (req, res) => {
  // ... existing code remains exactly as provided ...
});

/**
 * @swagger
 * /api/news/{sport}:
 *   get:
 *     summary: Get sport-specific news
 *     description: Retrieve news and odds for a specific sport (NBA, NFL, NHL).
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: sport
 *         required: true
 *         schema:
 *           type: string
 *           enum: [nba, nfl, nhl]
 *         description: Sport abbreviation
 *     responses:
 *       200:
 *         description: Sport-specific news and odds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 news:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NewsItem'
 *                 sport:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Invalid sport parameter
 *       500:
 *         description: Server error, returns fallback data
 */
router.get('/:sport', async (req, res) => {
  // ... existing code remains exactly as provided ...
});

// ============= NEW HELPER FUNCTIONS ============= //

function getFallbackNBANews() {
  const now = new Date().toISOString();
  return [
    {
      source: { id: 'espn', name: 'ESPN' },
      title: 'NBA Trade Deadline: Major Moves Expected',
      description: 'Several contending teams are looking to strengthen their rosters before the February deadline.',
      url: 'https://example.com/nba-trades',
      urlToImage: null,
      publishedAt: now,
      content: 'With the NBA trade deadline approaching, teams like the Lakers and Warriors are reportedly exploring options to upgrade their rosters...'
    },
    {
      source: { id: 'bleacher-report', name: 'Bleacher Report' },
      title: 'Rookie of the Year Race Heating Up',
      description: 'Close competition between top draft picks for the ROTY award.',
      url: 'https://example.com/roy-race',
      urlToImage: null,
      publishedAt: now,
      content: 'The rookie class of this season has shown exceptional talent, making the Rookie of the Year award highly competitive...'
    },
    {
      source: { id: 'nba-com', name: 'NBA.com' },
      title: 'All-Star Weekend Schedule Released',
      description: 'Complete schedule for the upcoming NBA All-Star weekend events.',
      url: 'https://example.com/all-star-schedule',
      urlToImage: null,
      publishedAt: now,
      content: 'The NBA has released the full schedule for All-Star weekend, including the three-point contest and slam dunk competition...'
    }
  ];
}

function getFallbackTrendingNews() {
  const now = new Date().toISOString();
  return [
    {
      title: 'NBA Finals Preview: Key Matchups to Watch',
      source: 'Sports Analytics',
      sport: 'NBA',
      url: 'https://example.com/finals-preview',
      publishedAt: now
    },
    {
      title: 'NFL Free Agency: Top Available Players',
      source: 'Sports Analytics',
      sport: 'NFL',
      url: 'https://example.com/nfl-free-agency',
      publishedAt: now
    },
    {
      title: 'MLB Spring Training Updates',
      source: 'Sports Analytics',
      sport: 'MLB',
      url: 'https://example.com/mlb-spring-training',
      publishedAt: now
    }
  ];
}

// ============= SWAGGER SCHEMA DEFINITIONS ============= //

/**
 * @swagger
 * components:
 *   schemas:
 *     NewsItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the news item
 *         title:
 *           type: string
 *           description: Headline/title of the news item
 *         summary:
 *           type: string
 *           description: Brief summary of the news content
 *         content:
 *           type: string
 *           description: Full content or detailed description
 *         type:
 *           type: string
 *           enum: [odds, prediction, game, update, event, schedule]
 *           description: Type of news content
 *         sport:
 *           type: string
 *           description: Sport category (NBA, NFL, NHL, etc.)
 *         source:
 *           type: string
 *           description: Source of the news data
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the news was published/retrieved
 *         priority:
 *           type: integer
 *           description: Display priority (1=highest)
 *       example:
 *         id: "odds_12345"
 *         title: "Odds Update: Lakers vs Celtics"
 *         summary: "Latest betting odds for tonight's matchup"
 *         content: "Spread: Lakers -5.5"
 *         type: "odds"
 *         sport: "NBA"
 *         source: "The Odds API"
 *         timestamp: "2026-01-31T14:30:00Z"
 *         priority: 1
 */

// Fallback news data functions remain exactly as provided...

export default router;
