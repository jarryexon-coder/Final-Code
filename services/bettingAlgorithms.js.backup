const nbaApiService = require('./nbaApiService');

class BettingAlgorithms {
  
  // Calculate value bet based on expected value
  calculateValueBet(odds, estimatedProbability) {
    const impliedProbability = 1 / odds;
    const expectedValue = (estimatedProbability * (odds - 1)) - (1 - estimatedProbability);
    
    return {
      expectedValue,
      isValueBet: expectedValue > 0,
      edge: (estimatedProbability - impliedProbability) * 100
    };
  }

  // Predict game outcome using simple Elo-like system
  async predictGameOutcome(homeTeam, awayTeam) {
    // Get team stats (simplified - in reality you'd have team ratings)
    const homeAdvantage = 65; // Home court advantage in rating points
    const homeRating = await this.getTeamRating(homeTeam);
    const awayRating = await this.getTeamRating(awayTeam);
    
    const expectedHome = 1 / (1 + Math.pow(10, (awayRating - homeRating - homeAdvantage) / 400));
    const expectedAway = 1 - expectedHome;
    
    return {
      homeWinProbability: expectedHome,
      awayWinProbability: expectedAway,
      predictedSpread: this.calculatePredictedSpread(homeRating, awayRating, homeAdvantage),
      confidence: Math.abs(expectedHome - 0.5) * 2 // 0-1 confidence score
    };
  }

  // Calculate predicted point spread
  calculatePredictedSpread(homeRating, awayRating, homeAdvantage) {
    const ratingDifference = homeRating - awayRating + homeAdvantage;
    // Convert rating difference to point spread (rough conversion)
    return ratingDifference / 25;
  }

  // Get team rating (simplified - use win percentage)
  async getTeamRating(teamName) {
    // This would fetch actual team data
    const teamRatings = {
      'Lakers': 1600,
      'Warriors': 1580,
      'Celtics': 1620,
      'Heat': 1550,
      'Bucks': 1610,
      'Nuggets': 1590
    };
    
    return teamRatings[teamName] || 1500;
  }

  // Analyze player props
  analyzePlayerProps(playerName, propType, line, odds) {
    const playerStats = nbaApiService.getPlayerStats(playerName);
    
    let historicalAverage;
    switch(propType) {
      case 'points':
        historicalAverage = playerStats.points;
        break;
      case 'rebounds':
        historicalAverage = playerStats.rebounds;
        break;
      case 'assists':
        historicalAverage = playerStats.assists;
        break;
      default:
        historicalAverage = line;
    }

    const standardDeviation = historicalAverage * 0.2; // Estimate std dev
    const zScore = (line - historicalAverage) / standardDeviation;
    
    // Calculate probability using normal distribution
    const probability = this.normalCDF(zScore);
    
    return this.calculateValueBet(odds, probability);
  }

  // Cumulative distribution function for normal distribution
  normalCDF(x) {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  // Error function approximation
  erf(x) {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = (x >= 0) ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  // Generate betting insights for a game
  async generateGameInsights(homeTeam, awayTeam) {
    const prediction = await this.predictGameOutcome(homeTeam, awayTeam);
    
    const insights = {
      game: `${homeTeam} vs ${awayTeam}`,
      prediction: {
        homeWinProbability: Math.round(prediction.homeWinProbability * 100),
        awayWinProbability: Math.round(prediction.awayWinProbability * 100),
        predictedSpread: prediction.predictedSpread.toFixed(1),
        confidence: Math.round(prediction.confidence * 100)
      },
      recommendations: []
    };

    // Generate recommendations based on prediction
    if (prediction.homeWinProbability > 0.6) {
      insights.recommendations.push({
        type: 'Moneyline',
        pick: homeTeam,
        confidence: 'High',
        reasoning: `Strong home advantage with ${Math.round(prediction.homeWinProbability * 100)}% win probability`
      });
    }

    if (Math.abs(prediction.predictedSpread) < 5) {
      insights.recommendations.push({
        type: 'Game',
        pick: 'Close game expected',
        confidence: 'Medium',
        reasoning: `Predicted spread of ${prediction.predictedSpread} points indicates competitive matchup`
      });
    }

    return insights;
  }
}

module.exports = new BettingAlgorithms();
