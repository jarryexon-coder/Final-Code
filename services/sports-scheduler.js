// services/sports-scheduler.js
const https = require('https');
const cron = require('node-cron');
const NodeCache = require('node-cache');
require('dotenv').config();

// Initialize cache
const apiCache = new NodeCache({ stdTTL: 3600 });

// API Configuration using environment variables
const API_CONFIG = {
  // NBA Player Props Odds
  playerProps: {
    hostname: 'nba-player-props-odds.p.rapidapi.com',
    path: '/get-player-odds-for-event?eventId=22200&bookieId=1%3A4%3A5%3A6%3A7%3A8%3A9%3A10&marketId=1%3A2%3A3%3A4%3A5%3A6&decimal=true&best=true',
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY_PLAYER_PROPS,
      'X-RapidAPI-Host': 'nba-player-props-odds.p.rapidapi.com'
    },
    schedule: '*/5 18-23 * * *',
    cacheKey: 'player_props',
    description: 'Player Props: Every 5 minutes (6pm-11:30pm ET)'
  },

  // Basketball Predictions
  predictions: {
    hostname: 'basketball-predictions1.p.rapidapi.com',
    path: '/predictions/list/competition-result?page=1',
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY_PREDICTIONS,
      'X-RapidAPI-Host': 'basketball-predictions1.p.rapidapi.com'
    },
    schedule: '*/20 * * * * *',
    cacheKey: 'predictions',
    description: 'Predictions: Every 20 seconds (24/7)'
  },

  // Ball Don't Lie API
  balldontlie: {
    hostname: 'api.balldontlie.io',
    path: '/v1/',
    apiKey: process.env.BALLDONTLIE_API_KEY,
    endpoints: ['games', 'players', 'stats'],
    cacheKey: 'balldontlie',
    rateLimit: 60,
    description: 'Ball Don\'t Lie: 60 requests/minute (24/7)'
  },

  // The Odds API
  odds: {
    hostname: 'api.the-odds-api.com',
    path: '/v4/sports/basketball_nba/odds/?regions=us&markets=h2h,spreads&oddsFormat=decimal&apiKey=' + process.env.THE_ODDS_API_KEY,
    schedule: '*/20 18-23 * * *',
    cacheKey: 'odds',
    description: 'Odds API: Every 20 minutes (6pm-11:30pm ET)'
  }
};

class SportsApiScheduler {
  constructor() {
    this.balldontlieRequests = 0;
    this.balldontlieResetTime = Date.now();
    this.validateEnvironmentVariables();
    this.setupSchedulers();
    this.logSchedules();
  }

  // Validate that required environment variables are set
  validateEnvironmentVariables() {
    const requiredVars = [
      'BALLDONTLIE_API_KEY',
      'THE_ODDS_API_KEY',
      'RAPIDAPI_KEY_PLAYER_PROPS', 
      'RAPIDAPI_KEY_PREDICTIONS'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing);
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    console.log('✅ All required environment variables are set');
  }

  // Generic API request function using native https
  makeAPIRequest(config, endpoint = '') {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: config.hostname,
        path: endpoint ? config.path + endpoint : config.path,
        method: 'GET',
        headers: config.headers || {},
        timeout: 10000
      };

      // Add API key as header for Ball Don't Lie
      if (config.apiKey && !config.headers) {
        options.headers['Authorization'] = config.apiKey;
      }

      console.log(`🔄 [${new Date().toLocaleTimeString('en-US', {timeZone: 'America/New_York'})} ET] Fetching: ${config.description}`);

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(data);
              
              // Cache the response
              if (config.cacheKey) {
                const cacheKey = endpoint ? `${config.cacheKey}_${endpoint}` : config.cacheKey;
                apiCache.set(cacheKey, {
                  data: parsedData,
                  lastUpdated: new Date().toISOString(),
                  lastUpdatedET: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
                });
              }

              console.log(`✅ [${new Date().toLocaleTimeString('en-US', {timeZone: 'America/New_York'})} ET] Success: ${config.description}`);
              resolve(parsedData);
            } catch (parseError) {
              console.error(`❌ JSON Parse Error for ${config.description}:`, parseError.message);
              reject(parseError);
            }
          } else {
            console.error(`❌ HTTP Error for ${config.description}: ${res.statusCode}`);
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('timeout', () => {
        console.error(`❌ Timeout for ${config.description}`);
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', (error) => {
        console.error(`❌ Request Error for ${config.description}:`, error.message);
        reject(error);
      });

      req.end();
    });
  }

  // NBA Player Props Odds (every 5 minutes, 6pm-11:30pm ET)
  setupPlayerPropsScheduler() {
    cron.schedule(API_CONFIG.playerProps.schedule, async () => {
      if (this.isWithinTimeWindow(18, 23.5)) {
        try {
          await this.makeAPIRequest(API_CONFIG.playerProps);
        } catch (error) {
          // Error already logged in makeAPIRequest
        }
      }
    }, {
      timezone: "America/New_York"
    });
  }

  // Basketball Predictions (every 20 seconds, 24/7)
  setupPredictionsScheduler() {
    cron.schedule(API_CONFIG.predictions.schedule, async () => {
      try {
        await this.makeAPIRequest(API_CONFIG.predictions);
      } catch (error) {
        // Error already logged in makeAPIRequest
      }
    });
  }

  // Ball Don't Lie API (60 requests/minute, 24/7)
  setupBalldontlieScheduler() {
    // Reset counter every minute
    setInterval(() => {
      this.balldontlieRequests = 0;
      this.balldontlieResetTime = Date.now();
    }, 60000);

    // Make requests respecting rate limit
    setInterval(async () => {
      if (this.balldontlieRequests < API_CONFIG.balldontlie.rateLimit) {
        const endpoint = this.getRandomEndpoint(API_CONFIG.balldontlie.endpoints);
        try {
          await this.makeAPIRequest(API_CONFIG.balldontlie, endpoint);
          this.balldontlieRequests++;
        } catch (error) {
          // Error already logged in makeAPIRequest
        }
      }
    }, 1000);
  }

  // The Odds API (every 20 minutes, 6pm-11:30pm ET)
  setupOddsScheduler() {
    cron.schedule(API_CONFIG.odds.schedule, async () => {
      if (this.isWithinTimeWindow(18, 23.5)) {
        try {
          await this.makeAPIRequest(API_CONFIG.odds);
        } catch (error) {
          // Error already logged in makeAPIRequest
        }
      }
    }, {
      timezone: "America/New_York"
    });
  }

  // Helper function to get random endpoint
  getRandomEndpoint(endpoints) {
    return endpoints[Math.floor(Math.random() * endpoints.length)];
  }

  // Helper function to check time window
  isWithinTimeWindow(startHour, endHour) {
    const now = new Date();
    const options = { timeZone: 'America/New_York', hour: '2-digit', hour12: false };
    const currentHourET = now.toLocaleTimeString('en-US', options);
    const currentHour = parseInt(currentHourET);
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + (currentMinute / 60);
    
    return currentTime >= startHour && currentTime <= endHour;
  }

  // Get cached data
  getCachedData(apiName, endpoint = '') {
    const cacheKey = endpoint ? `${apiName}_${endpoint}` : apiName;
    return apiCache.get(cacheKey);
  }

  // Get scheduler status
  getStatus() {
    const now = new Date();
    const etTime = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    
    return {
      currentTimeET: etTime,
      balldontlie: {
        requestsThisMinute: this.balldontlieRequests,
        rateLimit: API_CONFIG.balldontlie.rateLimit,
        resetIn: Math.max(0, 60000 - (Date.now() - this.balldontlieResetTime))
      },
      schedules: Object.values(API_CONFIG).map(config => ({
        service: config.cacheKey,
        description: config.description
      })),
      cacheStats: apiCache.getStats()
    };
  }

  // Log all schedules
  logSchedules() {
    console.log('\n🚀 Sports API Scheduler Initialized (Eastern Time)');
    console.log('=========================================');
    Object.values(API_CONFIG).forEach(config => {
      console.log(`📅 ${config.description}`);
    });
    console.log('=========================================\n');
  }

  // Setup all schedulers
  setupSchedulers() {
    this.setupPlayerPropsScheduler();
    this.setupPredictionsScheduler();
    this.setupBalldontlieScheduler();
    this.setupOddsScheduler();
  }
}

// Express routes to serve cached data
function createSportsRoutes(scheduler) {
  const express = require('express');
  const router = express.Router();

  // Get player props
  router.get('/player-props', (req, res) => {
    const data = scheduler.getCachedData('player_props');
    res.json(data || { message: 'No data available yet', nextUpdate: '6:00 PM ET' });
  });

  // Get predictions
  router.get('/predictions', (req, res) => {
    const data = scheduler.getCachedData('predictions');
    res.json(data || { message: 'No data available yet' });
  });

  // Get ball dont lie data
  router.get('/balldontlie/:endpoint?', (req, res) => {
    const endpoint = req.params.endpoint || 'games';
    const data = scheduler.getCachedData('balldontlie', endpoint);
    res.json(data || { message: 'No data available yet' });
  });

  // Get odds
  router.get('/odds', (req, res) => {
    const data = scheduler.getCachedData('odds');
    res.json(data || { message: 'No data available yet', nextUpdate: '6:00 PM ET' });
  });

  // Get scheduler status
  router.get('/status', (req, res) => {
    res.json(scheduler.getStatus());
  });

  return router;
}

// Initialize everything
const sportsScheduler = new SportsApiScheduler();
module.exports = { sportsScheduler, createSportsRoutes };
