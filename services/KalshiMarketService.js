/**
 * Kalshi Market Service
 * Interfaces with Kalshi prediction market API
 */

import axios from 'axios';
import mongoose from 'mongoose';

class KalshiMarketService {
  constructor() {
    this.baseUrl = process.env.KALSHI_API_URL || 'https://api.kalshi.com/v1';
    this.apiKey = process.env.KALSHI_API_KEY;
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get market data from Kalshi API
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Market data
   */
  async getMarkets(options = {}) {
    const cacheKey = `markets_${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration) {
        console.log(`📊 [KALSHI] Returning cached markets`);
        return cached.data;
      }
    }

    try {
      // If no API key, use mock data
      if (!this.apiKey) {
        console.log('⚠️ [KALSHI] No API key, returning mock data');
        return this.getMockMarkets(options);
      }

      const params = {
        limit: options.limit || 50,
        offset: options.offset || 0,
        status: options.status || 'open',
        ...options
      };

      const response = await axios.get(`${this.baseUrl}/markets`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        },
        params
      });

      const markets = response.data.markets || [];
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: markets,
        timestamp: Date.now()
      });

      console.log(`✅ [KALSHI] Fetched ${markets.length} markets`);
      return markets;

    } catch (error) {
      console.error('❌ [KALSHI] Error fetching markets:', error.message);
      
      // Fallback to mock data
      return this.getMockMarkets(options);
    }
  }

  /**
   * Get specific market by ticker
   * @param {string} ticker - Market ticker
   * @returns {Promise<Object>} Market data
   */
  async getMarketByTicker(ticker) {
    try {
      if (!this.apiKey) {
        return this.getMockMarketByTicker(ticker);
      }

      const response = await axios.get(`${this.baseUrl}/markets/${ticker}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;

    } catch (error) {
      console.error(`❌ [KALSHI] Error fetching market ${ticker}:`, error.message);
      return this.getMockMarketByTicker(ticker);
    }
  }

  /**
   * Get market history
   * @param {string} ticker - Market ticker
   * @param {string} period - Time period (1d, 7d, 30d)
   * @returns {Promise<Array>} Price history
   */
  async getMarketHistory(ticker, period = '7d') {
    try {
      // In production, this would call Kalshi's historical data endpoint
      return this.generateMockHistory(period);
    } catch (error) {
      console.error(`❌ [KALSHI] Error fetching history for ${ticker}:`, error.message);
      return this.generateMockHistory(period);
    }
  }

  /**
   * Calculate arbitrage opportunities
   * @param {Array} markets - Market data
   * @returns {Array} Arbitrage opportunities
   */
  findArbitrageOpportunities(markets) {
    const opportunities = [];

    markets.forEach(market => {
      const yesPrice = market.yes_price || market.yesPrice || 50;
      const noPrice = market.no_price || market.noPrice || 50;
      
      // Calculate implied probabilities
      const yesProbability = yesPrice / 100;
      const noProbability = noPrice / 100;
      
      // Check for arbitrage (probabilities should sum to 1)
      const sum = yesProbability + noProbability;
      const arbitrageEdge = Math.abs(1 - sum);
      
      if (arbitrageEdge > 0.02) { // 2% edge threshold
        opportunities.push({
          marketId: market.ticker,
          title: market.title || market.question,
          yesPrice,
          noPrice,
          yesProbability: (yesProbability * 100).toFixed(1),
          noProbability: (noProbability * 100).toFixed(1),
          arbitrageEdge: (arbitrageEdge * 100).toFixed(2),
          recommendation: yesProbability < noProbability ? 'BUY YES' : 'BUY NO',
          confidence: Math.min(arbitrageEdge * 100, 100).toFixed(1)
        });
      }
    });

    return opportunities.sort((a, b) => b.arbitrageEdge - a.arbitrageEdge);
  }

  /**
   * Analyze market sentiment
   * @param {Array} markets - Market data
   * @returns {Object} Sentiment analysis
   */
  analyzeMarketSentiment(markets) {
    let totalVolume = 0;
    let totalYesPrice = 0;
    let totalNoPrice = 0;
    let bullishMarkets = 0;
    let bearishMarkets = 0;

    markets.forEach(market => {
      const yesPrice = market.yes_price || market.yesPrice || 50;
      const noPrice = market.no_price || market.noPrice || 50;
      const volume = market.volume || 0;

      totalVolume += volume;
      totalYesPrice += yesPrice;
      totalNoPrice += noPrice;

      if (yesPrice > 60) bullishMarkets++;
      if (noPrice > 60) bearishMarkets++;
    });

    const avgYesPrice = totalYesPrice / markets.length;
    const avgNoPrice = totalNoPrice / markets.length;
    const marketCount = markets.length;

    return {
      totalMarkets: marketCount,
      totalVolume,
      avgYesPrice: avgYesPrice.toFixed(2),
      avgNoPrice: avgNoPrice.toFixed(2),
      bullishRatio: ((bullishMarkets / marketCount) * 100).toFixed(1),
      bearishRatio: ((bearishMarkets / marketCount) * 100).toFixed(1),
      overallSentiment: avgYesPrice > 50 ? 'Bullish' : 'Bearish',
      sentimentStrength: Math.abs(avgYesPrice - 50).toFixed(1)
    };
  }

  /**
   * Find correlated markets
   * @param {Array} markets - Market data
   * @returns {Array} Correlated market pairs
   */
  findCorrelatedMarkets(markets) {
    const correlations = [];

    for (let i = 0; i < markets.length; i++) {
      for (let j = i + 1; j < markets.length; j++) {
        const market1 = markets[i];
        const market2 = markets[j];

        // Simple correlation calculation (in production would use historical data)
        const correlation = this.calculateCorrelation(market1, market2);

        if (Math.abs(correlation) > 0.7) {
          correlations.push({
            market1: market1.ticker,
            market2: market2.ticker,
            correlation: correlation.toFixed(3),
            relationship: correlation > 0 ? 'Positive' : 'Negative',
            strength: Math.abs(correlation) > 0.9 ? 'Strong' : 'Moderate',
            suggestion: correlation > 0 ? 'Hedge positions' : 'Diversify'
          });
        }
      }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  /**
   * Calculate correlation between two markets
   * @private
   */
  calculateCorrelation(market1, market2) {
    // Mock correlation calculation
    // In production, this would use historical price data
    const seed = market1.ticker.charCodeAt(0) + market2.ticker.charCodeAt(0);
    return (Math.sin(seed) * 2) - 1; // Returns between -1 and 1
  }

  /**
   * Mock data for development
   */
  getMockMarkets(options = {}) {
    const mockMarkets = [
      {
        ticker: 'SP500-5000',
        title: 'Will S&P 500 close above 5,000 in 2024?',
        category: 'Financial',
        yes_price: 65,
        no_price: 35,
        volume: 125000,
        change_24h: 3.2,
        open_interest: 50000,
        status: 'open',
        settlement_date: '2024-12-31',
        description: 'Bet on whether the S&P 500 index will close above 5,000 points by the end of 2024.'
      },
      {
        ticker: 'FED-CUT-Q1',
        title: 'Will Fed cut rates in Q1 2025?',
        category: 'Economics',
        yes_price: 42,
        no_price: 58,
        volume: 89000,
        change_24h: -1.5,
        open_interest: 32000,
        status: 'open',
        settlement_date: '2025-03-31',
        description: 'Predict whether the Federal Reserve will cut interest rates by at least 0.25% in Q1 2025.'
      },
      {
        ticker: 'NBA-CHAMP',
        title: 'Will Boston Celtics win 2024 NBA Championship?',
        category: 'Sports',
        yes_price: 78,
        no_price: 22,
        volume: 156000,
        change_24h: 5.7,
        open_interest: 75000,
        status: 'open',
        settlement_date: '2024-06-30',
        description: 'Bet on whether the Boston Celtics will win the 2024 NBA Championship.'
      },
      {
        ticker: 'UE-BELOW-4',
        title: 'Will unemployment rate be below 4% in June 2025?',
        category: 'Economics',
        yes_price: 33,
        no_price: 67,
        volume: 67000,
        change_24h: 0.8,
        open_interest: 28000,
        status: 'open',
        settlement_date: '2025-06-30',
        description: 'Predict whether the US unemployment rate will be below 4% in June 2025.'
      },
      {
        ticker: 'RECESSION-25',
        title: 'Will there be a recession in 2025?',
        category: 'Financial',
        yes_price: 55,
        no_price: 45,
        volume: 112000,
        change_24h: -2.3,
        open_interest: 45000,
        status: 'open',
        settlement_date: '2025-12-31',
        description: 'Bet on whether the US will experience a recession (2 consecutive quarters of negative GDP growth) in 2025.'
      }
    ];

    // Filter by category if specified
    if (options.category && options.category !== 'all') {
      return mockMarkets.filter(market => market.category === options.category);
    }

    // Filter by search query
    if (options.search) {
      const query = options.search.toLowerCase();
      return mockMarkets.filter(market => 
        market.title.toLowerCase().includes(query) ||
        market.ticker.toLowerCase().includes(query)
      );
    }

    return mockMarkets;
  }

  getMockMarketByTicker(ticker) {
    const markets = this.getMockMarkets();
    return markets.find(market => market.ticker === ticker) || markets[0];
  }

  generateMockHistory(period) {
    const dataPoints = period === '1d' ? 24 : period === '7d' ? 7 : 30;
    const history = [];
    let price = 50;

    for (let i = 0; i < dataPoints; i++) {
      price += (Math.random() - 0.5) * 10;
      price = Math.max(1, Math.min(99, price));

      history.push({
        timestamp: new Date(Date.now() - (dataPoints - i) * 24 * 60 * 60 * 1000),
        yes_price: Math.round(price),
        volume: Math.round(Math.random() * 10000),
      });
    }

    return history;
  }

  /**
   * Log Kalshi trade to database
   * @param {Object} tradeData - Trade information
   */
  async logTrade(tradeData) {
    try {
      const db = mongoose.connection.db;
      const collection = db.collection('kalshi_trades');

      const trade = {
        userId: tradeData.userId,
        marketTicker: tradeData.marketTicker,
        side: tradeData.side, // 'yes' or 'no'
        amount: tradeData.amount,
        price: tradeData.price,
        timestamp: new Date(),
        status: 'filled',
        pnl: 0, // Will be updated on settlement
        metadata: tradeData.metadata || {}
      };

      const result = await collection.insertOne(trade);
      console.log(`✅ [KALSHI] Trade logged: ${result.insertedId}`);

      return result;

    } catch (error) {
      console.error('❌ [KALSHI] Error logging trade:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new KalshiMarketService();
