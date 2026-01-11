// config/dataSources.js
export const DATA_SOURCES = {
  NBA: {
    odds: {
      provider: 'the-odds-api',
      url: 'https://api.the-odds-api.com/v4/sports/basketball_nba/odds',
      params: { 
        regions: 'us', 
        markets: 'h2h,spreads,totals', 
        oddsFormat: 'american',
        apiKey: process.env.ODDS_API_KEY 
      }
    },
    stats: {
      provider: 'sportsdataio',
      url: 'https://api.sportsdata.io/v3/nba',
      endpoints: {
        playerGameStats: 'https://api.sportsdata.io/v3/nba/stats/json/PlayerGameStatsByDate/{date}',
        teamStats: 'https://api.sportsdata.io/v3/nba/stats/json/TeamSeasonStats/{season}',
        playerDetails: 'https://api.sportsdata.io/v3/nba/scores/json/Players',
        standings: 'https://api.sportsdata.io/v3/nba/scores/json/Standings/{season}'
      },
      apiKey: process.env.SPORTS_DATA_API_KEY
    },
    scores: {
      provider: 'sportsdataio',
      url: 'https://api.sportsdata.io/v3/nba/scores/json/GamesByDate/{date}',
      apiKey: process.env.SPORTS_DATA_API_KEY
    },
    news: {
      provider: 'newsapi',
      url: 'https://newsapi.org/v2/everything',
      params: {
        q: 'NBA basketball',
        language: 'en',
        sortBy: 'publishedAt',
        apiKey: process.env.NEWS_API_KEY
      }
    }
  },
  NFL: {
    odds: {
      provider: 'the-odds-api',
      url: 'https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds',
      params: { 
        regions: 'us', 
        markets: 'h2h,spreads,totals', 
        oddsFormat: 'american',
        apiKey: process.env.ODDS_API_KEY 
      }
    },
    stats: {
      provider: 'sportsdataio',
      url: 'https://api.sportsdata.io/v3/nfl',
      endpoints: {
        playerGameStats: 'https://api.sportsdata.io/v3/nfl/stats/json/PlayerGameStatsByWeek/{season}/{week}',
        teamStats: 'https://api.sportsdata.io/v3/nfl/stats/json/TeamSeasonStats/{season}'
      },
      apiKey: process.env.SPORTS_DATA_API_KEY
    }
  },
  NHL: {
    odds: {
      provider: 'the-odds-api',
      url: 'https://api.the-odds-api.com/v4/sports/icehockey_nhl/odds',
      params: { 
        regions: 'us', 
        markets: 'h2h', 
        oddsFormat: 'american',
        apiKey: process.env.ODDS_API_KEY 
      }
    },
    stats: {
      provider: 'sportsdataio',
      url: 'https://api.sportsdata.io/v3/nhl',
      endpoints: {
        playerGameStats: 'https://api.sportsdata.io/v3/nhl/stats/json/PlayerGameStatsByDate/{date}',
        teamStats: 'https://api.sportsdata.io/v3/nhl/stats/json/TeamSeasonStats/{season}'
      },
      apiKey: process.env.SPORTS_DATA_API_KEY
    }
  },
  MLB: {
    odds: {
      provider: 'the-odds-api',
      url: 'https://api.the-odds-api.com/v4/sports/baseball_mlb/odds',
      params: { 
        regions: 'us', 
        markets: 'h2h', 
        oddsFormat: 'american',
        apiKey: process.env.ODDS_API_KEY 
      }
    }
  },
  weather: {
    provider: 'weatherapi',
    url: 'http://api.weatherapi.com/v1/current.json',
    params: {
      key: process.env.WEATHER_API_KEY,
      q: '',
      aqi: 'no'
    }
  },
  kalshi: {
    provider: 'kalshi',
    url: 'https://api.kalshi.com/trade-api/v2',
    endpoints: {
      markets: '/markets',
      events: '/events',
      orderbook: '/markets/{market_id}/orderbook'
    },
    apiKey: process.env.KALSHI_API_KEY,
    apiSecret: process.env.KALSHI_API_SECRET
  }
};

// Helper function to build URLs with parameters
export function buildURL(source, sport, endpoint, params = {}) {
  const config = DATA_SOURCES[sport][source];
  if (!config) {
    throw new Error(`Configuration not found for ${sport}.${source}`);
  }

  let url = config.url;
  
  // Replace path parameters
  if (config.endpoints && config.endpoints[endpoint]) {
    url = config.endpoints[endpoint];
    Object.keys(params).forEach(key => {
      url = url.replace(`{${key}}`, params[key]);
    });
  }
  
  // Add query parameters
  const queryParams = new URLSearchParams({
    ...config.params,
    ...params
  });
  
  // Remove API key from logs for security
  const safeQueryString = queryParams.toString().replace(/apiKey=[^&]+/, 'apiKey=***');
  console.log(`🔗 Building URL: ${url}?${safeQueryString}`);
  
  return `${url}?${queryParams.toString()}`;
}

// Get headers for API calls
export function getHeaders(provider) {
  const headers = {
    'User-Agent': 'NBA-Fantasy-AI/5.0',
    'Accept': 'application/json'
  };
  
  switch(provider) {
    case 'sportsdataio':
      headers['Ocp-Apim-Subscription-Key'] = process.env.SPORTS_DATA_API_KEY;
      break;
    case 'kalshi':
      headers['Authorization'] = `Bearer ${process.env.KALSHI_API_KEY}`;
      break;
    case 'the-odds-api':
      // API key is in query params
      break;
  }
  
  return headers;
}
