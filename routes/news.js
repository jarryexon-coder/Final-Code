// routes/news.js - Updated to use YOUR available APIs
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Use your existing API keys from environment
const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY;
const THE_ODDS_API_KEY = process.env.THE_ODDS_API_KEY;
const RAPIDAPI_KEY_PLAYER_PROPS = process.env.RAPIDAPI_KEY_PLAYER_PROPS;
const RAPIDAPI_KEY_PREDICTIONS = process.env.RAPIDAPI_KEY_PREDICTIONS;

// GET /api/news/latest - Returns combined news/updates
router.get('/latest', async (req, res) => {
  try {
    console.log('📰 Fetching latest news from available APIs...');
    
    // Fetch from multiple sources in parallel
    const [oddsData, predictionsData, nbaGames] = await Promise.allSettled([
      // Get upcoming games with odds (The Odds API)
      axios.get('https://api.the-odds-api.com/v4/sports/basketball_nba/odds', {
        params: {
          apiKey: THE_ODDS_API_KEY,
          regions: 'us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'american'
        }
      }).catch(() => null),
      
      // Get predictions (RapidAPI)
      axios.get('https://predictions-api.p.rapidapi.com/v2/sports/basketball/predictions', {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY_PREDICTIONS,
          'X-RapidAPI-Host': 'predictions-api.p.rapidapi.com'
        },
        params: {
          date: new Date().toISOString().split('T')[0]
        }
      }).catch(() => null),
      
      // Get NBA games (BallDontLie API)
      axios.get('https://api.balldontlie.io/v1/games', {
        headers: {
          'Authorization': BALLDONTLIE_API_KEY
        },
        params: {
          'dates[]': [new Date().toISOString().split('T')[0]],
          per_page: 10
        }
      }).catch(() => null)
    ]);

    // Process and combine data
    const newsItems = [];
    const now = new Date().toISOString();
    
    // Process odds data
    if (oddsData.status === 'fulfilled' && oddsData.value?.data) {
      oddsData.value.data.slice(0, 5).forEach(game => {
        newsItems.push({
          id: `odds_${game.id}`,
          title: `Odds Update: ${game.home_team} vs ${game.away_team}`,
          summary: `Latest betting odds for tonight's matchup`,
          content: `Spread: ${game.bookmakers?.[0]?.markets?.[1]?.outcomes?.[0]?.point || 'N/A'}`,
          type: 'odds',
          sport: 'NBA',
          source: 'The Odds API',
          timestamp: now,
          priority: 1
        });
      });
    }
    
    // Process predictions
    if (predictionsData.status === 'fulfilled' && predictionsData.value?.data) {
      predictionsData.value.data.slice(0, 3).forEach(prediction => {
        newsItems.push({
          id: `pred_${prediction.id}`,
          title: `AI Prediction: ${prediction.title || 'Game Forecast'}`,
          summary: `Machine learning forecast for upcoming games`,
          content: prediction.description || 'Prediction data available',
          type: 'prediction',
          sport: 'NBA',
          source: 'RapidAPI Predictions',
          timestamp: now,
          priority: 2
        });
      });
    }
    
    // Process NBA games
    if (nbaGames.status === 'fulfilled' && nbaGames.value?.data?.data) {
      nbaGames.value.data.data.slice(0, 3).forEach(game => {
        newsItems.push({
          id: `game_${game.id}`,
          title: `Game Today: ${game.home_team.full_name} vs ${game.visitor_team.full_name}`,
          summary: `Tip-off at ${game.status}`,
          content: `Venue: ${game.home_team.city} - ${game.status}`,
          type: 'game',
          sport: 'NBA',
          source: 'BallDontLie API',
          timestamp: now,
          priority: 3
        });
      });
    }
    
    // If no API data, provide fallback
    if (newsItems.length === 0) {
      newsItems.push(...getFallbackNews());
    }
    
    // Sort by priority and timestamp
    newsItems.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    res.json({
      success: true,
      news: newsItems.slice(0, 10), // Limit to 10 items
      count: newsItems.length,
      sources: Array.from(new Set(newsItems.map(item => item.source))),
      timestamp: now
    });
    
  } catch (error) {
    console.error('News aggregation error:', error.message);
    
    // Fallback to mock data
    res.json({
      success: true,
      news: getFallbackNews(),
      count: 5,
      sources: ['Fallback'],
      message: 'Using fallback news data',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/news/:sport - Sport-specific news
router.get('/:sport', async (req, res) => {
  const sport = req.params.sport.toLowerCase();
  const sportMap = {
    nba: { name: 'basketball_nba', api: 'balldontlie', key: BALLDONTLIE_API_KEY },
    nfl: { name: 'americanfootball_nfl', api: 'nfl', key: process.env.NFL_API_KEY },
    nhl: { name: 'icehockey_nhl', api: 'nhl', key: process.env.NHL_API_KEY }
  };
  
  const config = sportMap[sport];
  
  if (!config) {
    return res.status(400).json({
      success: false,
      error: `Invalid sport. Supported: ${Object.keys(sportMap).join(', ')}`
    });
  }
  
  try {
    let newsItems = [];
    const now = new Date().toISOString();
    
    // Try to get odds for this sport
    try {
      const oddsResponse = await axios.get(
        `https://api.the-odds-api.com/v4/sports/${config.name}/odds`,
        {
          params: {
            apiKey: THE_ODDS_API_KEY,
            regions: 'us',
            markets: 'h2h',
            oddsFormat: 'american'
          }
        }
      );
      
      if (oddsResponse.data) {
        oddsResponse.data.slice(0, 5).forEach(game => {
          newsItems.push({
            id: `odds_${game.id}`,
            title: `${sport.toUpperCase()} Odds: ${game.home_team || 'Home'} vs ${game.away_team || 'Away'}`,
            type: 'odds',
            sport: sport.toUpperCase(),
            source: 'The Odds API',
            timestamp: now
          });
        });
      }
    } catch (oddsError) {
      console.log(`No odds data for ${sport}:`, oddsError.message);
    }
    
    // Add sport-specific fallback if no data
    if (newsItems.length === 0) {
      newsItems = getSportFallbackNews(sport);
    }
    
    res.json({
      success: true,
      news: newsItems,
      sport: sport.toUpperCase(),
      count: newsItems.length,
      timestamp: now
    });
    
  } catch (error) {
    console.error(`${sport} news error:`, error.message);
    res.json({
      success: true,
      news: getSportFallbackNews(sport),
      sport: sport.toUpperCase(),
      count: 3,
      message: 'Using fallback data'
    });
  }
});

// Fallback news data
function getFallbackNews() {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      title: "NBA Trade Deadline Approaching",
      summary: "Teams are making final moves before the February deadline",
      content: "Key players could be on the move as teams position for playoffs",
      type: "update",
      sport: "NBA",
      source: "Sports Analytics",
      timestamp: now,
      priority: 1
    },
    {
      id: 2,
      title: "NFL Playoff Predictions",
      summary: "Updated analytics show new Super Bowl favorites",
      content: "Statistical models updated after wild card weekend results",
      type: "prediction",
      sport: "NFL",
      source: "Sports Analytics",
      timestamp: now,
      priority: 2
    },
    {
      id: 3,
      title: "NHL All-Star Weekend",
      summary: "Preview of this year's NHL All-Star events",
      content: "Skills competition and All-Star game schedule",
      type: "event",
      sport: "NHL",
      source: "Sports Analytics",
      timestamp: now,
      priority: 3
    }
  ];
}

function getSportFallbackNews(sport) {
  const now = new Date().toISOString();
  const sportName = sport.toUpperCase();
  
  return [
    {
      id: 1,
      title: `${sportName} Updates`,
      summary: `Latest news and updates for ${sportName}`,
      type: "update",
      sport: sportName,
      source: "Sports Analytics",
      timestamp: now
    },
    {
      id: 2,
      title: `${sportName} Game Schedule`,
      summary: `Upcoming ${sportName} games this week`,
      type: "schedule",
      sport: sportName,
      source: "Sports Analytics",
      timestamp: now
    }
  ];
}

module.exports = router;
