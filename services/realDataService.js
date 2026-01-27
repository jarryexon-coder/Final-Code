import axios from 'axios';

class RealDataService {
  constructor() {
    this.sportsDataKey = process.env.SPORTSDATA_API_KEY;
    this.oddsApiKey = process.env.ODDS_API_KEY;
    this.kalshiApiKey = process.env.KALSHI_API_KEY;
    this.draftKingsApiKey = process.env.DRAFTKINGS_API_KEY;
    this.fanDuelApiKey = process.env.FANDUEL_API_KEY;
    
    // API endpoints
    this.baseUrls = {
      sportsData: 'https://api.sportsdata.io/v3',
      oddsApi: 'https://api.the-odds-api.com/v4',
      kalshi: 'https://api.kalshi.com/v1',
      draftKings: 'https://api.draftkings.com',
      fanDuel: 'https://api.fanduel.com'
    };
  }

  // ============ NBA METHODS ============
  
  async getRealNBAGames(date = new Date()) {
    try {
      const response = await axios.get(
        `${this.baseUrls.sportsData}/nba/scores/json/GamesByDate/${date.toISOString().split('T')[0]}`,
        { headers: { 'Ocp-Apim-Subscription-Key': this.sportsDataKey } }
      );
      return this.formatNBAGames(response.data);
    } catch (error) {
      console.error('Error fetching NBA games:', error);
      return this.getESPNNBAGames(date);
    }
  }

  async getESPNNBAGames(date = new Date()) {
    try {
      const espnDate = date.toISOString().split('T')[0].replace(/-/g, '');
      const response = await axios.get(
        `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${espnDate}`
      );
      return this.formatESPNNBAGames(response.data);
    } catch (error) {
      console.error('Error fetching ESPN NBA games:', error);
      return null;
    }
  }

  async getRealNBAStandings() {
    try {
      const response = await axios.get(
        `${this.baseUrls.sportsData}/nba/scores/json/Standings/${new Date().getFullYear()}`,
        { headers: { 'Ocp-Apim-Subscription-Key': this.sportsDataKey } }
      );
      return this.formatNBAStandings(response.data);
    } catch (error) {
      console.error('Error fetching NBA standings:', error);
      return null;
    }
  }

  // ============ NHL METHODS ============
  
  async getRealNHLGames(date = new Date()) {
    try {
      const response = await axios.get(
        `${this.baseUrls.sportsData}/nhl/scores/json/GamesByDate/${date.toISOString().split('T')[0]}`,
        { headers: { 'Ocp-Apim-Subscription-Key': this.sportsDataKey } }
      );
      return this.formatNHLGames(response.data);
    } catch (error) {
      console.error('Error fetching NHL games:', error);
      return this.getESPNNHLGames(date);
    }
  }

  async getRealNHLStandings() {
    try {
      const response = await axios.get(
        `${this.baseUrls.sportsData}/nhl/scores/json/Standings/${new Date().getFullYear()}`,
        { headers: { 'Ocp-Apim-Subscription-Key': this.sportsDataKey } }
      );
      return this.formatNHLStandings(response.data);
    } catch (error) {
      console.error('Error fetching NHL standings:', error);
      return null;
    }
  }

  async getESPNNHLGames(date = new Date()) {
    try {
      const espnDate = date.toISOString().split('T')[0].replace(/-/g, '');
      const response = await axios.get(
        `http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${espnDate}`
      );
      return this.formatESPNNHLGames(response.data);
    } catch (error) {
      console.error('Error fetching ESPN NHL games:', error);
      return null;
    }
  }

  // ============ NFL METHODS ============
  
  async getRealNFLGames(date = new Date()) {
    try {
      const response = await axios.get(
        `${this.baseUrls.sportsData}/nfl/scores/json/GamesByDate/${date.toISOString().split('T')[0]}`,
        { headers: { 'Ocp-Apim-Subscription-Key': this.sportsDataKey } }
      );
      return this.formatNFLGames(response.data);
    } catch (error) {
      console.error('Error fetching NFL games:', error);
      return this.getESPNNFLGames(date);
    }
  }

  async getRealNFLStandings() {
    try {
      const response = await axios.get(
        `${this.baseUrls.sportsData}/nfl/scores/json/Standings/${new Date().getFullYear()}`,
        { headers: { 'Ocp-Apim-Subscription-Key': this.sportsDataKey } }
      );
      return this.formatNFLStandings(response.data);
    } catch (error) {
      console.error('Error fetching NFL standings:', error);
      return null;
    }
  }

  async getESPNNFLGames(date = new Date()) {
    try {
      const espnDate = date.toISOString().split('T')[0].replace(/-/g, '');
      const response = await axios.get(
        `http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${espnDate}`
      );
      return this.formatESPNNFLGames(response.data);
    } catch (error) {
      console.error('Error fetching ESPN NFL games:', error);
      return null;
    }
  }

  // ============ KALSHI PREDICTIONS ============
  
  async getKalshiPredictions(sport = 'nba', date = null) {
    try {
      // Get Kalshi markets for the specified sport
      const response = await axios.get(
        `${this.baseUrls.kalshi.com}/markets`,
        {
          headers: {
            'Authorization': `Bearer ${this.kalshiApiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            sport: sport.toUpperCase(),
            status: 'active',
            limit: 100
          }
        }
      );
      
      return this.formatKalshiMarkets(response.data.markets, sport);
    } catch (error) {
      console.error('Error fetching Kalshi predictions:', error);
      return null;
    }
  }

  async getKalshiMarketDetails(marketId) {
    try {
      const response = await axios.get(
        `${this.baseUrls.kalshi}/markets/${marketId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.kalshiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching Kalshi market details:', error);
      return null;
    }
  }

  // ============ FANDUEL SNAKE DRAFT ============
  
  async getFanDuelSnakeDraftLobbies(sport = 'nba') {
    try {
      const response = await axios.get(
        `${this.baseUrls.fanDuel}/draft/lobbies`,
        {
          headers: {
            'Authorization': `Bearer ${this.fanDuelApiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            sport: sport.toLowerCase(),
            draft_type: 'snake',
            status: 'open'
          }
        }
      );
      return this.formatFanDuelLobbies(response.data.lobbies);
    } catch (error) {
      console.error('Error fetching FanDuel snake draft lobbies:', error);
      return null;
    }
  }

  async getFanDuelSnakeDraftRoom(roomId) {
    try {
      const response = await axios.get(
        `${this.baseUrls.fanDuel}/draft/rooms/${roomId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.fanDuelApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching FanDuel draft room:', error);
      return null;
    }
  }

  async getFanDuelPlayerRankings(sport = 'nba', format = 'standard') {
    try {
      const response = await axios.get(
        `${this.baseUrls.fanDuel}/draft/rankings/${sport.toLowerCase()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.fanDuelApiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            format: format,
            limit: 500
          }
        }
      );
      return response.data.rankings;
    } catch (error) {
      console.error('Error fetching FanDuel player rankings:', error);
      return null;
    }
  }

  // ============ DRAFTKINGS TOURNAMENT DRAFT ============
  
  async getDraftKingsTournamentDrafts(sport = 'nba', contestType = 'tournament') {
    try {
      const response = await axios.get(
        `${this.baseUrls.draftKings}/drafts/v1/contests`,
        {
          headers: {
            'Authorization': `Bearer ${this.draftKingsApiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            sport: sport.toUpperCase(),
            contestType: contestType,
            status: 'OPEN'
          }
        }
      );
      return this.formatDraftKingsContests(response.data.contests);
    } catch (error) {
      console.error('Error fetching DraftKings tournament drafts:', error);
      return null;
    }
  }

  async getDraftKingsDraftablePlayers(sport = 'nba', contestId) {
    try {
      const response = await axios.get(
        `${this.baseUrls.draftKings}/drafts/v1/contests/${contestId}/players`,
        {
          headers: {
            'Authorization': `Bearer ${this.draftKingsApiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            sport: sport.toUpperCase()
          }
        }
      );
      return response.data.players;
    } catch (error) {
      console.error('Error fetching DraftKings draftable players:', error);
      return null;
    }
  }

  async getDraftKingsOptimalLineup(sport = 'nba', contestId, budget = 50000) {
    try {
      const response = await axios.post(
        `${this.baseUrls.draftKings}/drafts/v1/lineups/optimize`,
        {
          contestId: contestId,
          sport: sport.toUpperCase(),
          budget: budget,
          constraints: {
            minPlayers: 8,
            maxPlayers: 8,
            positionRequirements: {
              PG: { min: 1, max: 3 },
              SG: { min: 1, max: 3 },
              SF: { min: 1, max: 3 },
              PF: { min: 1, max: 3 },
              C: { min: 1, max: 2 }
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.draftKingsApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.lineup;
    } catch (error) {
      console.error('Error fetching DraftKings optimal lineup:', error);
      return null;
    }
  }

  // ============ FANTASY DATA ============
  
  async getRealFantasyProjections(sport, date = new Date()) {
    try {
      // Try multiple sources for projections
      const [fantasyProsData, numberFireData] = await Promise.allSettled([
        this.getFantasyProsProjections(sport, date),
        this.getNumberFireProjections(sport, date)
      ]);
      
      return {
        fantasyPros: fantasyProsData.status === 'fulfilled' ? fantasyProsData.value : null,
        numberFire: numberFireData.status === 'fulfilled' ? numberFireData.value : null,
        merged: this.mergeProjections(
          fantasyProsData.status === 'fulfilled' ? fantasyProsData.value : [],
          numberFireData.status === 'fulfilled' ? numberFireData.value : []
        )
      };
    } catch (error) {
      console.error('Error fetching fantasy projections:', error);
      return null;
    }
  }

  async getFantasyProsProjections(sport, date) {
    try {
      const response = await axios.get(
        `https://api.fantasypros.com/v2/json/${sport}/projections/${date.toISOString().split('T')[0]}`,
        { headers: { 'x-api-key': process.env.FANTASYPROS_API_KEY } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching FantasyPros projections:', error);
      return null;
    }
  }

  async getNumberFireProjections(sport, date) {
    try {
      const response = await axios.get(
        `https://api.numberfire.com/v1/${sport}/daily-projections`,
        {
          params: {
            date: date.toISOString().split('T')[0]
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching NumberFire projections:', error);
      return null;
    }
  }

  // ============ FORMATTING METHODS ============

  formatNBAGames(games) {
    return {
      success: true,
      games: games.map(game => ({
        id: game.GameID,
        date: game.DateTime,
        homeTeam: {
          id: game.HomeTeamID,
          name: game.HomeTeam,
          score: game.HomeTeamScore,
          record: `${game.HomeTeamWins}-${game.HomeTeamLosses}`,
          logo: `https://cdn.nba.com/logos/nba/${game.HomeTeamID}/primary/L/logo.svg`
        },
        awayTeam: {
          id: game.AwayTeamID,
          name: game.AwayTeam,
          score: game.AwayTeamScore,
          record: `${game.AwayTeamWins}-${game.AwayTeamLosses}`,
          logo: `https://cdn.nba.com/logos/nba/${game.AwayTeamID}/primary/L/logo.svg`
        },
        status: game.Status,
        period: game.Quarter,
        time: game.TimeRemainingMinutes,
        location: game.Arena,
        broadcast: game.Channel,
        odds: game.Odds || null
      })),
      lastUpdated: new Date().toISOString(),
      source: 'sportsdata.io'
    };
  }

  formatNHLGames(games) {
    return {
      success: true,
      games: games.map(game => ({
        id: game.GameID,
        date: game.DateTime,
        homeTeam: {
          id: game.HomeTeamID,
          name: game.HomeTeam,
          score: game.HomeTeamScore,
          record: game.HomeTeamWins !== undefined ? `${game.HomeTeamWins}-${game.HomeTeamLosses}-${game.HomeTeamOtLosses}` : null
        },
        awayTeam: {
          id: game.AwayTeamID,
          name: game.AwayTeam,
          score: game.AwayTeamScore,
          record: game.AwayTeamWins !== undefined ? `${game.AwayTeamWins}-${game.AwayTeamLosses}-${game.AwayTeamOtLosses}` : null
        },
        status: game.Status,
        period: game.Period,
        time: game.TimeRemainingMinutes,
        location: game.Arena,
        broadcast: game.Channel,
        powerPlay: game.PowerPlay || false
      })),
      lastUpdated: new Date().toISOString(),
      source: 'sportsdata.io'
    };
  }

  formatNFLGames(games) {
    return {
      success: true,
      games: games.map(game => ({
        id: game.GameID,
        date: game.DateTime,
        homeTeam: {
          id: game.HomeTeamID,
          name: game.HomeTeam,
          score: game.HomeTeamScore,
          record: game.HomeTeamWins !== undefined ? `${game.HomeTeamWins}-${game.HomeTeamLosses}` : null
        },
        awayTeam: {
          id: game.AwayTeamID,
          name: game.AwayTeam,
          score: game.AwayTeamScore,
          record: game.AwayTeamWins !== undefined ? `${game.AwayTeamWins}-${game.AwayTeamLosses}` : null
        },
        status: game.Status,
        quarter: game.Quarter,
        time: game.TimeRemainingMinutes,
        location: game.Stadium,
        broadcast: game.Channel,
        spread: game.PointSpread,
        overUnder: game.OverUnder
      })),
      lastUpdated: new Date().toISOString(),
      source: 'sportsdata.io'
    };
  }

  formatNBAStandings(standings) {
    return {
      success: true,
      standings: standings.map(team => ({
        teamId: team.TeamID,
        name: team.Name,
        city: team.City,
        wins: team.Wins,
        losses: team.Losses,
        winPercentage: team.Percentage,
        conference: team.Conference,
        division: team.Division,
        conferenceRank: team.ConferenceRank,
        divisionRank: team.DivisionRank,
        streak: team.StreakDescription,
        homeRecord: `${team.HomeWins}-${team.HomeLosses}`,
        awayRecord: `${team.AwayWins}-${team.AwayLosses}`,
        lastTen: `${team.LastTenWins}-${team.LastTenLosses}`
      })),
      lastUpdated: new Date().toISOString()
    };
  }

  formatNHLStandings(standings) {
    return {
      success: true,
      standings: standings.map(team => ({
        teamId: team.TeamID,
        name: team.Name,
        city: team.City,
        wins: team.Wins,
        losses: team.Losses,
        otLosses: team.OtLosses,
        points: team.Points,
        division: team.Division,
        conference: team.Conference,
        gamesPlayed: team.Games,
        goalsFor: team.GoalsFor,
        goalsAgainst: team.GoalsAgainst,
        streak: team.StreakDescription
      })),
      lastUpdated: new Date().toISOString()
    };
  }

  formatNFLStandings(standings) {
    return {
      success: true,
      standings: standings.map(team => ({
        teamId: team.TeamID,
        name: team.Name,
        city: team.City,
        wins: team.Wins,
        losses: team.Losses,
        ties: team.Ties,
        winPercentage: team.Percentage,
        division: team.Division,
        conference: team.Conference,
        pointsFor: team.PointsFor,
        pointsAgainst: team.PointsAgainst,
        streak: team.StreakDescription
      })),
      lastUpdated: new Date().toISOString()
    };
  }

  formatKalshiMarkets(markets, sport) {
    return {
      success: true,
      sport: sport,
      markets: markets.map(market => ({
        id: market.id,
        title: market.title,
        ticker: market.ticker,
        yesPrice: market.yes_price,
        noPrice: market.no_price,
        volume: market.volume,
        openTime: market.open_time,
        closeTime: market.close_time,
        status: market.status,
        sport: market.sport,
        category: market.category,
        tags: market.tags || []
      })),
      lastUpdated: new Date().toISOString()
    };
  }

  formatFanDuelLobbies(lobbies) {
    return {
      success: true,
      lobbies: lobbies.map(lobby => ({
        id: lobby.id,
        name: lobby.name,
        sport: lobby.sport,
        draftType: lobby.draft_type,
        entryFee: lobby.entry_fee,
        prizePool: lobby.prize_pool,
        maxPlayers: lobby.max_players,
        currentPlayers: lobby.current_players,
        draftTime: lobby.draft_time,
        status: lobby.status,
        settings: lobby.settings || {}
      })),
      lastUpdated: new Date().toISOString()
    };
  }

  formatDraftKingsContests(contests) {
    return {
      success: true,
      contests: contests.map(contest => ({
        id: contest.id,
        name: contest.name,
        sport: contest.sport,
        contestType: contest.contest_type,
        entryFee: contest.entry_fee,
        prizePool: contest.prize_pool,
        maxEntries: contest.max_entries,
        currentEntries: contest.current_entries,
        startTime: contest.start_time,
        draftType: contest.draft_type,
        salaryCap: contest.salary_cap,
        rosterSize: contest.roster_size,
        guaranteed: contest.guaranteed || false,
        multiEntry: contest.multi_entry || false
      })),
      lastUpdated: new Date().toISOString()
    };
  }

  formatESPNNBAGames(data) {
    return {
      success: true,
      games: data.events.map(event => ({
        id: event.id,
        date: event.date,
        homeTeam: {
          id: event.competitions[0].competitors[0].id,
          name: event.competitions[0].competitors[0].team.displayName,
          score: event.competitions[0].competitors[0].score,
          record: event.competitions[0].competitors[0].records?.[0]?.summary || null
        },
        awayTeam: {
          id: event.competitions[0].competitors[1].id,
          name: event.competitions[0].competitors[1].team.displayName,
          score: event.competitions[0].competitors[1].score,
          record: event.competitions[0].competitors[1].records?.[0]?.summary || null
        },
        status: event.status.type.description,
        period: event.status.period,
        time: event.status.displayClock,
        location: event.competitions[0].venue?.fullName || null,
        broadcast: event.competitions[0].geobroadcasts?.[0]?.media?.shortName || null
      })),
      lastUpdated: new Date().toISOString(),
      source: 'espn.com'
    };
  }

  formatESPNNHLGames(data) {
    return this.formatESPNNBAGames(data); // Similar format
  }

  formatESPNNFLGames(data) {
    return this.formatESPNNBAGames(data); // Similar format
  }

  mergeProjections(fantasyPros, numberFire) {
    // Implement logic to merge projections from multiple sources
    const merged = {};
    
    if (fantasyPros) {
      fantasyPros.forEach(player => {
        merged[player.id] = {
          ...player,
          sources: ['fantasyPros']
        };
      });
    }
    
    if (numberFire) {
      numberFire.forEach(player => {
        if (merged[player.id]) {
          merged[player.id].sources.push('numberFire');
          // Average projections from different sources
          merged[player.id].averageProjection = this.calculateAverageProjection(
            merged[player.id],
            player
          );
        } else {
          merged[player.id] = {
            ...player,
            sources: ['numberFire']
          };
        }
      });
    }
    
    return Object.values(merged);
  }

  calculateAverageProjection(existingPlayer, newPlayer) {
    // Calculate average projections from multiple sources
    const fields = ['points', 'rebounds', 'assists', 'steals', 'blocks', 'fantasyPoints'];
    const averages = {};
    
    fields.forEach(field => {
      if (existingPlayer[field] && newPlayer[field]) {
        averages[field] = (existingPlayer[field] + newPlayer[field]) / 2;
      } else if (existingPlayer[field]) {
        averages[field] = existingPlayer[field];
      } else if (newPlayer[field]) {
        averages[field] = newPlayer[field];
      }
    });
    
    return averages;
  }

  // ============ HELPER METHODS ============
  
  async getSportsOdds(sport, region = 'us', markets = 'h2h,spreads,totals') {
    try {
      const response = await axios.get(
        `${this.baseUrls.oddsApi}/sports/${sport}/odds`,
        {
          params: {
            apiKey: this.oddsApiKey,
            regions: region,
            markets: markets,
            oddsFormat: 'decimal',
            dateFormat: 'iso'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching sports odds:', error);
      return null;
    }
  }

  async getInjuries(sport, date = new Date()) {
    try {
      const response = await axios.get(
        `${this.baseUrls.sportsData}/${sport}/scores/json/Injuries/${date.toISOString().split('T')[0]}`,
        { headers: { 'Ocp-Apim-Subscription-Key': this.sportsDataKey } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${sport} injuries:`, error);
      return null;
    }
  }

  async getPlayerStats(sport, playerId) {
    try {
      const response = await axios.get(
        `${this.baseUrls.sportsData}/${sport}/scores/json/Player/${playerId}`,
        { headers: { 'Ocp-Apim-Subscription-Key': this.sportsDataKey } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${sport} player stats:`, error);
      return null;
    }
  }
}

export default RealDataService;

