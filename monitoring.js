// monitoring.js
import axios from 'axios';

class HealthMonitor {
  constructor() {
    this.endpoints = [
      'http://localhost:3002/health',
      'http://localhost:3002/api/health',
      'http://localhost:3002/api/nba/games',
      'http://localhost:3002/api/kalshi/health'
    ];
  }

  async checkAll() {
    const results = [];
    for (const endpoint of this.endpoints) {
      try {
        const response = await axios.get(endpoint, { timeout: 5000 });
        results.push({
          endpoint,
          status: response.status,
          healthy: response.status === 200,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          endpoint,
          status: error.response?.status || 0,
          healthy: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    return results;
  }
}

export default HealthMonitor;
