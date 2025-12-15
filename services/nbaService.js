import Player from '../models/Player.js';
import axios from 'axios';

class NBAService {
  // Mock data for demonstration - replace with real NBA API
  static mockPlayerData = {
    'LeBron James': { points: 25.3, rebounds: 7.8, assists: 7.3, games_played: 67, team: 'LAL', position: 'SF' },
    'Stephen Curry': { points: 27.4, rebounds: 5.1, assists: 6.3, games_played: 65, team: 'GSW', position: 'PG' },
    'Kevin Durant': { points: 28.5, rebounds: 7.2, assists: 5.8, games_played: 62, team: 'PHX', position: 'PF' },
    'Giannis Antetokounmpo': { points: 30.1, rebounds: 11.2, assists: 6.3, games_played: 70, team: 'MIL', position: 'PF' }
  };

  static async getPlayerStats(playerName) {
    try {
      console.log(`Fetching stats for: ${playerName}`);
      
      // Check database first
      const cachedPlayer = await Player.findOne({ 
        name: new RegExp(playerName, 'i'),
        lastUpdated: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours
      });

      if (cachedPlayer) {
        console.log('Returning cached data from database');
        return {
          success: true,
          data: cachedPlayer,
          source: 'database'
        };
      }

      // If not in cache, get from API (mock for now)
      const playerData = this.mockPlayerData[playerName];
      
      if (!playerData) {
        return {
          success: false,
          error: 'Player not found in our database'
        };
      }

      // Save to database for future requests
      const player = await Player.findOneAndUpdate(
        { name: new RegExp(playerName, 'i') },
        {
          name: playerName,
          ...playerData,
          source: 'mock-api',
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );

      console.log('Saved player data to database:', player.name);
      
      return {
        success: true,
        data: player,
        source: 'api'
      };

    } catch (error) {
      console.error('Error in getPlayerStats:', error);
      return {
        success: false,
        error: 'Failed to fetch player data'
      };
    }
  }

  // Method to get all players from database
  static async getAllPlayers() {
    try {
      const players = await Player.find().sort({ points: -1 }).limit(50);
      return players;
    } catch (error) {
      console.error('Error getting all players:', error);
      return [];
    }
  }

  // Search players by name
  static async searchPlayers(query) {
    try {
      const players = await Player.find({
        name: new RegExp(query, 'i')
      }).limit(10);
      
      return players;
    } catch (error) {
      console.error('Error searching players:', error);
      return [];
    }
  }
}

export default NBAService;
