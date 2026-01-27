/**
 * Data Formatting Utilities for Sports APIs
 */

export class DataFormatters {
  
  // Format SportsData.io NBA games
  static formatSportsDataNBAGames(apiData) {
    return {
      success: true,
      games: apiData.map(game => ({
        id: game.GameID,
        externalId: game.GameID.toString(),
        sport: 'NBA',
        date: new Date(game.DateTime),
        status: this.convertStatus(game.Status),
        homeTeam: {
          id: game.HomeTeamID.toString(),
          name: game.HomeTeam,
          abbreviation: game.HomeTeam,
          score: game.HomeTeamScore || null,
          record: `${game.HomeTeamWins || 0}-${game.HomeTeamLosses || 0}`
        },
        awayTeam: {
          id: game.AwayTeamID.toString(),
          name: game.AwayTeam,
          abbreviation: game.AwayTeam,
          score: game.AwayTeamScore || null,
          record: `${game.AwayTeamWins || 0}-${game.AwayTeamLosses || 0}`
        },
        venue: game.Arena || 'Unknown',
        location: game.Arena || 'Unknown',
        broadcast: game.Channel || 'TBD',
        period: game.Quarter || null,
        timeRemaining: game.TimeRemainingMinutes || null,
        odds: game.Odds ? {
          home: game.Odds.HomeMoneyLine,
          away: game.Odds.AwayMoneyLine,
          overUnder: game.Odds.OverUnder,
          spread: game.Odds.PointSpread
        } : null,
        lastUpdated: new Date(),
        source: 'sportsdata.io'
      })),
      count: apiData.length,
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Format ESPN NBA games
  static formatESPNNBAGames(apiData) {
    if (!apiData.events) return { success: false, games: [] };
    
    return {
      success: true,
      games: apiData.events.map(event => ({
        id: event.id,
        externalId: event.id,
        sport: 'NBA',
        date: new Date(event.date),
        status: this.convertESPNStatus(event.status.type.state),
        homeTeam: {
          id: event.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.id,
          name: event.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.team?.displayName,
          abbreviation: event.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.team?.abbreviation,
          score: parseInt(event.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.score || 0),
          record: event.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.records?.[0]?.summary || '0-0'
        },
        awayTeam: {
          id: event.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.id,
          name: event.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.team?.displayName,
          abbreviation: event.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.team?.abbreviation,
          score: parseInt(event.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.score || 0),
          record: event.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.records?.[0]?.summary || '0-0'
        },
        venue: event.competitions[0]?.venue?.fullName || 'Unknown',
        location: event.competitions[0]?.venue?.address?.city || 'Unknown',
        broadcast: event.competitions[0]?.broadcasts?.[0]?.names?.[0] || 'TBD',
        period: event.status?.period || null,
        timeRemaining: event.status?.displayClock || null,
        odds: event.competitions[0]?.odds?.[0] ? {
          home: event.competitions[0].odds[0].homeMoneyLine,
          away: event.competitions[0].odds[0].awayMoneyLine,
          overUnder: event.competitions[0].odds[0].overUnder,
          spread: event.competitions[0].odds[0].spread
        } : null,
        lastUpdated: new Date(),
        source: 'espn'
      })),
      count: apiData.events.length,
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Format SportsData.io NHL games
  static formatSportsDataNHLGames(apiData) {
    return {
      success: true,
      games: apiData.map(game => ({
        id: game.GameID,
        externalId: game.GameID.toString(),
        sport: 'NHL',
        date: new Date(game.DateTime),
        status: this.convertStatus(game.Status),
        homeTeam: {
          id: game.HomeTeamID.toString(),
          name: game.HomeTeam,
          abbreviation: game.HomeTeam,
          score: game.HomeTeamScore || null,
          record: `${game.HomeTeamWins || 0}-${game.HomeTeamLosses || 0}`
        },
        awayTeam: {
          id: game.AwayTeamID.toString(),
          name: game.AwayTeam,
          abbreviation: game.AwayTeam,
          score: game.AwayTeamScore || null,
          record: `${game.AwayTeamWins || 0}-${game.AwayTeamLosses || 0}`
        },
        venue: game.Arena || 'Unknown',
        location: game.Arena || 'Unknown',
        broadcast: game.Channel || 'TBD',
        period: game.Period || null,
        timeRemaining: game.TimeRemainingMinutes || null,
        odds: null, // NHL odds may need separate API
        lastUpdated: new Date(),
        source: 'sportsdata.io'
      })),
      count: apiData.length,
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Format player stats from SportsData.io
  static formatSportsDataPlayerStats(playerData, seasonStats) {
    return {
      id: playerData.PlayerID,
      externalId: playerData.PlayerID.toString(),
      sport: 'NBA',
      name: playerData.FirstName + ' ' + playerData.LastName,
      position: playerData.Position,
      team: {
        id: playerData.TeamID?.toString(),
        name: playerData.Team,
        abbreviation: playerData.Team
      },
      stats: {
        season: {
          games: seasonStats.Games || 0,
          points: seasonStats.Points || 0,
          rebounds: seasonStats.Rebounds || 0,
          assists: seasonStats.Assists || 0,
          steals: seasonStats.Steals || 0,
          blocks: seasonStats.BlockedShots || 0,
          fieldGoalPercentage: seasonStats.FieldGoalsPercentage || 0,
          threePointPercentage: seasonStats.ThreePointersPercentage || 0,
          freeThrowPercentage: seasonStats.FreeThrowsPercentage || 0,
          minutes: seasonStats.Minutes || 0,
          turnovers: seasonStats.Turnovers || 0
        }
      },
      injury: playerData.InjuryStatus ? {
        status: this.convertInjuryStatus(playerData.InjuryStatus),
        details: playerData.InjuryBodyPart,
        updated: new Date()
      } : null,
      lastUpdated: new Date(),
      source: 'sportsdata.io'
    };
  }
  
  // Format fantasy projections
  static formatFantasyProjections(projections, platform = 'fanduel') {
    return projections.map(proj => ({
      playerId: proj.playerId,
      name: proj.playerName,
      position: proj.position,
      team: proj.teamAbbreviation,
      stats: {
        fantasy: {
          [platform]: {
            salary: proj.salary || 0,
            projection: proj.fantasyPoints || 0,
            value: proj.value || 0,
            ownership: proj.ownership || 0,
            ceiling: proj.ceiling || 0,
            floor: proj.floor || 0
          }
        }
      },
      matchup: proj.opponent,
      gameTime: proj.gameTime,
      lastUpdated: new Date()
    }));
  }
  
  // Helper methods
  static convertStatus(apiStatus) {
    const statusMap = {
      'Scheduled': 'Scheduled',
      'InProgress': 'Live',
      'Final': 'Final',
      'Postponed': 'Postponed',
      'Canceled': 'Canceled',
      'Delayed': 'Postponed',
      'Suspended': 'Postponed'
    };
    return statusMap[apiStatus] || 'Scheduled';
  }
  
  static convertESPNStatus(espnStatus) {
    const statusMap = {
      'pre': 'Scheduled',
      'in': 'Live',
      'post': 'Final',
      'postponed': 'Postponed',
      'canceled': 'Canceled'
    };
    return statusMap[espnStatus] || 'Scheduled';
  }
  
  static convertInjuryStatus(injuryStatus) {
    const statusMap = {
      'Active': 'ACTIVE',
      'Out': 'OUT',
      'Questionable': 'GTD',
      'Doubtful': 'DOUBTFUL',
      'Probable': 'ACTIVE'
    };
    return statusMap[injuryStatus] || 'ACTIVE';
  }
  
  // Calculate fantasy value score
  static calculateValueScore(salary, projection) {
    if (!salary || salary === 0) return 0;
    return (projection / (salary / 1000)).toFixed(2);
  }
  
  // Normalize data for database
  static normalizeForDatabase(data, type) {
    switch(type) {
      case 'game':
        return {
          ...data,
          date: new Date(data.date),
          lastUpdated: new Date(),
          createdAt: new Date()
        };
      case 'player':
        return {
          ...data,
          lastUpdated: new Date(),
          createdAt: new Date()
        };
      default:
        return {
          ...data,
          lastUpdated: new Date(),
          createdAt: new Date()
        };
    }
  }
}
