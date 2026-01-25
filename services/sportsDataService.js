// services/sportsDataService.js
import axios from 'axios';

const API_KEYS = {
  NBA: process.env.NBA_API_KEY,
  NFL: process.env.NFL_API_KEY,
  NHL: process.env.NHL_API_KEY,
  MLB: process.env.MLB_API_KEY
};

const API_ENDPOINTS = {
  NBA: 'https://api-nba-v1.p.rapidapi.com',
  NFL: 'https://api-nfl-v1.p.rapidapi.com',
  NHL: 'https://api-nhl-v1.p.rapidapi.com',
  MLB: 'https://api-mlb-v1.p.rapidapi.com'
};

export const fetchSportsData = async (sport, endpoint, params = {}) => {
  try {
    const apiKey = API_KEYS[sport];
    const baseUrl = API_ENDPOINTS[sport];

    if (!apiKey || !baseUrl) {
      throw new Error(`API configuration missing for ${sport}`);
    }

    // Map endpoints to specific API paths
    const endpointMap = {
      'live-scores': '/games/live',
      'schedule': '/games',
      'standings': '/standings',
      'player-stats': '/players/statistics',
      'team-stats': '/teams/statistics',
      'game-details': '/games',
      'odds': '/odds',
      'search-players': '/players',
      'search-teams': '/teams',
      'search-games': '/games',
      'injuries': '/injuries',
      'news': '/news',
      'roster': '/players',
      'player-game-log': '/players/gamelog',
      'team-game-log': '/teams/gamelog',
      'league-leaders': '/players/leaders'
    };

    const url = `${baseUrl}${endpointMap[endpoint] || `/${endpoint}`}`;
    
    const headers = {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': baseUrl.replace('https://', '')
    };

    const response = await axios.get(url, {
      headers,
      params,
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching ${sport} data from ${endpoint}:`, error.message);
    
    // Return mock data if API fails (for development)
    if (process.env.NODE_ENV === 'development') {
      return getMockData(sport, endpoint, params);
    }
    
    throw error;
  }
};

// Mock data for development
const getMockData = (sport, endpoint, params) => {
  // Return appropriate mock data based on endpoint
  // This is a simplified example - you'd want more realistic mock data
  const mockData = {
    'live-scores': [
      {
        gameId: `${sport}_${Date.now()}`,
        status: 'In Progress',
        homeTeam: 'Home Team',
        awayTeam: 'Away Team',
        homeScore: Math.floor(Math.random() * 120),
        awayScore: Math.floor(Math.random() * 120)
      }
    ],
    'schedule': [],
    'standings': [],
    'player-stats': {},
    'team-stats': {}
  };

  return mockData[endpoint] || [];
};
