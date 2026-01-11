// services/sportsAnalyticsService.js
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

class SportsAnalyticsService {
  constructor() {
    this.apiKey = process.env.SPORTS_DATA_API_KEY;
    this.baseURL = 'https://api.sportsdata.io/v3/nba';
  }

  async getArbitrageOpportunities(sport = 'NBA') {
    if (!this.apiKey) {
      console.warn('⚠️ Using mock data - SPORTS_DATA_API_KEY not configured');
      return this.getMockArbitrage(sport);
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/odds/json/BettingMarkets`,
        { headers: { 'Ocp-Apim-Subscription-Key': this.apiKey } }
      );
      // Process real arbitrage data
      return this.processArbitrageData(response.data);
    } catch (error) {
      console.error('Real data fetch failed:', error.message);
      return this.getMockArbitrage(sport);
    }
  }

  // ... other real methods

  // Fallback mock data
  getMockArbitrage(sport) {
    return {
      opportunities: [
        {
          game: `${sport} Mock Game`,
          market: 'Moneyline',
          book1: { name: 'Book A', odds: 1.85 },
          book2: { name: 'Book B', odds: 2.10 },
          arbitragePercentage: 5.2
        }
      ],
      note: 'Using mock data - configure API key for real data'
    };
  }
}

export default new SportsAnalyticsService();
