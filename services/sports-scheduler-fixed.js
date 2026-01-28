// services/sports-scheduler.js - FIXED VERSION
import https from 'https';
import cron from 'node-cron';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

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
    this.balldontlieInterval = null;
    this.balldontlieResetInterval = null;
    this.activeIntervals = new Set();
    this.validateEnvironmentVariables();
    this.setupSchedulers();
    this.logSchedules();
  }

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

  makeAPIRequest(config, endpoint = '') {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: config.hostname,
        path: endpoint ? config.path + endpoint : config.path,
        method: 'GET',
        headers: config.headers || {},
        timeout: 10000
      };

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

  // FIXED METHOD: This was missing
  async balldontlieRequestHandler() {
    if (this.balldontlieRequests < API_CONFIG.balldontlie.rateLimit) {
      const endpoint = this.getRandomEndpoint(API_CONFIG.balldontlie.endpoints);
      try {
        await this.makeAPIRequest(API_CONFIG.balldontlie, endpoint);
        this.balldontlieRequests++;
      } catch (error) {
        if (error.message && error.message.includes('429')) {
          console.log('⏸️  Rate limit hit, pausing for 5 seconds...');
          clearInterval(this.balldontlieInterval);
          setTimeout(() => {
            const self = this;
            this.balldontlieInterval = setInterval(() => self.balldontlieRequestHandler(), 1000);
          }, 5000);
        }
      }
    } else {
      console.log(`⏸️  Rate limit reached (${this.balldontlieRequests}/${API_CONFIG.balldontlie.rateLimit}), waiting for reset...`);
    }
  }

  setupPlayerPropsScheduler() {
    cron.schedule(API_CONFIG.playerProps.schedule, async () => {
      if (this.isWithinTimeWindow(18, 23.5)) {
        try {
          await this.makeAPIRequest(API_CONFIG.playerProps);
        } catch (error) {
          // Error already logged
        }
      }
    }, {
      timezone: "America/New_York"
    });
  }

  setupPredictionsScheduler() {
    cron.schedule(API_CONFIG.predictions.schedule, async () => {
      try {
        await this.makeAPIRequest(API_CONFIG.predictions);
      } catch (error) {
        // Error already logged
      }
    });
  }

  setupBalldontlieScheduler() {
    // Reset counter every minute
    this.balldontlieResetInterval = setInterval(() => {
      this.balldontlieRequests = 0;
      this.balldontlieResetTime = Date.now();
      console.log(`🔄 Ball Don't Lie rate limit reset. Requests: ${this.balldontlieRequests}`);
    }, 60000);

    this.activeIntervals.add(this.balldontlieResetInterval);

    // Start the request handler
    this.balldontlieInterval = setInterval(() => {
      this.balldontlieRequestHandler();
    }, 1000);

    this.activeIntervals.add(this.balldontlieInterval);
  }

  setupOddsScheduler() {
    cron.schedule(API_CONFIG.odds.schedule, async () => {
      if (this.isWithinTimeWindow(18, 23.5)) {
        try {
          await this.makeAPIRequest(API_CONFIG.odds);
        } catch (error) {
          console.error(`❌ Failed to fetch odds: ${error.message}`);
        }
      }
    }, {
      timezone: "America/New_York"
    });
  }

  getRandomEndpoint(endpoints) {
    return endpoints[Math.floor(Math.random() * endpoints.length)];
  }

  isWithinTimeWindow(startHour, endHour) {
    const now = new Date();
    const options = { timeZone: 'America/New_York', hour: '2-digit', hour12: false };
    const currentHourET = now.toLocaleTimeString('en-US', options);
    const currentHour = parseInt(currentHourET);
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + (currentMinute / 60);
    
    return currentTime >= startHour && currentTime <= endHour;
  }

  getCachedData(apiName, endpoint = '') {
    const cacheKey = endpoint ? `${apiName}_${endpoint}` : apiName;
    return apiCache.get(cacheKey);
  }

  getStatus() {
    const now = new Date();
    const etTime = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    
    return {
      currentTimeET: etTime,
      balldontlie: {
        requestsThisMinute: this.balldontlieRequests,
        rateLimit: API_CONFIG.balldontlie.rateLimit,
        resetIn: Math.max(0, 60000 - (Date.now() - this.balldontlieResetTime)),
        resetTime: new Date(this.balldontlieResetTime + 60000).toLocaleTimeString('en-US', {timeZone: 'America/New_York'})
      },
      schedules: Object.values(API_CONFIG).map(config => ({
        service: config.cacheKey,
        description: config.description
      })),
      cacheStats: apiCache.getStats()
    };
  }

  logSchedules() {
    console.log('\n🚀 Sports API Scheduler Initialized (Eastern Time)');
    console.log('=========================================');
    Object.values(API_CONFIG).forEach(config => {
      console.log(`📅 ${config.description}`);
    });
    console.log('=========================================\n');
  }

  setupSchedulers() {
    this.setupPlayerPropsScheduler();
    this.setupPredictionsScheduler();
    this.setupBalldontlieScheduler();
    this.setupOddsScheduler();
  }

  cleanup() {
    console.log('🧹 Cleaning up scheduler intervals...');
    
    if (this.balldontlieInterval) {
      clearInterval(this.balldontlieInterval);
      console.log('✅ Cleared Ball Don\'t Lie interval');
    }
    
    if (this.balldontlieResetInterval) {
      clearInterval(this.balldontlieResetInterval);
      console.log('✅ Cleared Ball Don\'t Lie reset interval');
    }
    
    this.activeIntervals.forEach(intervalId => {
      clearInterval(intervalId);
    });
    this.activeIntervals.clear();
    
    console.log('✅ All scheduler intervals cleaned up');
  }
}

// Express routes to serve cached data
function createSportsRoutes(scheduler) {
  const router = express.Router();

  router.get('/player-props', (req, res) => {
    const data = scheduler.getCachedData('player_props');
    res.json(data || { message: 'No data available yet', nextUpdate: '6:00 PM ET' });
  });

  router.get('/predictions', (req, res) => {
    const data = scheduler.getCachedData('predictions');
    res.json(data || { message: 'No data available yet' });
  });

  router.get('/balldontlie/:endpoint?', (req, res) => {
    const endpoint = req.params.endpoint || 'games';
    const data = scheduler.getCachedData('balldontlie', endpoint);
    res.json(data || { message: 'No data available yet' });
  });

  router.get('/odds', (req, res) => {
    const data = scheduler.getCachedData('odds');
    res.json(data || { message: 'No data available yet', nextUpdate: '6:00 PM ET' });
  });

  router.get('/status', (req, res) => {
    res.json(scheduler.getStatus());
  });

  router.post('/cleanup', (req, res) => {
    scheduler.cleanup();
    res.json({ message: 'Scheduler intervals cleaned up' });
  });

  return router;
}

// Initialize everything
const sportsScheduler = new SportsApiScheduler();

// Add graceful shutdown handler
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT (Ctrl+C). Cleaning up scheduler...');
  sportsScheduler.cleanup();
  setTimeout(() => {
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  }, 1000);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Cleaning up scheduler...');
  sportsScheduler.cleanup();
  setTimeout(() => {
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  }, 1000);
});

export { sportsScheduler, createSportsRoutes };
