const fetch = require('node-fetch');

class NBADataService {
  constructor() {
    this.baseURL = 'https://www.balldontlie.io/api/v1';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
  }

  async makeRequest(endpoint, params = {}) {
    const urlParams = new URLSearchParams(params);
    const url = `${this.baseURL}${endpoint}?${urlParams}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  async getAllPlayers(page = 0, perPage = 25) {
    try {
      return await this.makeRequest('/players', { page, per_page: perPage });
    } catch (error) {
      console.error('Error fetching players:', error.message);
      throw new Error('Failed to fetch NBA players data');
    }
  }

  async getPlayerStats(playerId, season = '2024') {
    try {
      return await this.makeRequest('/stats', {
        'player_ids[]': playerId,
        seasons: season,
        per_page: 100
      });
    } catch (error) {
      console.error('Error fetching player stats:', error.message);
      throw new Error('Failed to fetch player statistics');
    }
  }

  async searchPlayers(query) {
    try {
      return await this.makeRequest('/players', {
        search: query,
        per_page: 25
      });
    } catch (error) {
      console.error('Error searching players:', error.message);
      throw new Error('Failed to search players');
    }
  }

  async getGames(date = new Date().toISOString().split('T')[0]) {
    try {
      return await this.makeRequest('/games', {
        'dates[]': date,
        per_page: 50
      });
    } catch (error) {
      console.error('Error fetching games:', error.message);
      throw new Error('Failed to fetch games data');
    }
  }

  async getTeamRoster(teamId) {
    try {
      return await this.makeRequest('/players', {
        'team_ids[]': teamId,
        per_page: 25
      });
    } catch (error) {
      console.error('Error fetching team roster:', error.message);
      throw new Error('Failed to fetch team roster');
    }
  }
}

module.exports = new NBADataService();
