const fantasyController = {
  getFantasyAdvice: async (req, res) => {
    try {
      const sport = req.query.sport || 'NBA';
      
      // 1. Get real-time data from multiple sources
      const [injuries, matchups, playerStats, weather] = await Promise.all([
        fetchInjuryReports(sport),
        fetchTodayMatchups(sport),
        fetchPlayerStats(sport),
        fetchWeatherForGames(sport)
      ]);

      // 2. Apply fantasy algorithms
      const recommendations = {
        must_starts: calculateMustStarts({
          injuries,
          matchups,
          playerStats,
          weather,
          sport
        }),
        sleepers: calculateSleepers({
          injuries,
          matchups,
          playerStats,
          ownership: await fetchOwnershipData(sport),
          salary: await fetchSalaryData(sport)
        }),
        avoids: calculateAvoids({
          injuries,
          matchups,
          playerStats,
          recentPerformance: await fetchRecentPerformance(sport)
        }),
        lastUpdated: new Date().toISOString(),
        nextUpdate: new Date(Date.now() + 15 * 60 * 1000).toISOString() // Update every 15 min
      };

      // 3. Cache for 5 minutes
      await cacheFantasyData(sport, recommendations);

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      console.error('Fantasy advice error:', error);
      res.status(500).json({ success: false, error: 'Failed to load fantasy advice' });
    }
  }
};

// Algorithm functions
function calculateMustStarts(data) {
  return data.playerStats
    .filter(player => {
      // Criteria for must-start:
      // 1. Healthy (no injuries)
      // 2. Favorable matchup
      // 3. High usage rate
      // 4. Good recent performance
      // 5. Projected high minutes
      const isHealthy = !data.injuries.some(inj => inj.playerId === player.id);
      const hasFavorableMatchup = checkFavorableMatchup(player, data.matchups);
      const highUsage = player.usageRate > 25;
      const goodRecent = player.last5Avg > player.seasonAvg * 0.9;
      
      return isHealthy && hasFavorableMatchup && highUsage && goodRecent;
    })
    .sort((a, b) => b.fantasyProjection - a.fantasyProjection)
    .slice(0, 5)
    .map(player => ({
      player: player.name,
      team: player.team,
      position: player.position,
      projection: player.fantasyProjection.toFixed(1),
      value: 'Elite',
      injury: player.injuryStatus || '',
      matchup: getMatchupText(player, data.matchups),
      reasoning: generateReasoning(player, data)
    }));
}

function calculateSleepers(data) {
  return data.playerStats
    .filter(player => {
      // Criteria for sleepers:
      // 1. Low ownership (< 10%)
      // 2. Value play (low salary, high projection)
      // 3. Upside potential
      // 4. Increased role due to injuries
      const lowOwnership = data.ownership[player.id] < 10;
      const goodValue = player.fantasyProjection / player.salary > 0.006;
      const hasUpside = player.upsideScore > 7;
      const increasedRole = checkIncreasedRole(player, data.injuries);
      
      return lowOwnership && goodValue && (hasUpside || increasedRole);
    })
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, 3)
    .map(player => ({
      player: player.name,
      team: player.team,
      position: player.position,
      projection: player.fantasyProjection.toFixed(1),
      value: 'Value',
      salary: `$${player.salary.toLocaleString()}`,
      reasoning: generateSleeperReasoning(player, data)
    }));
}

module.exports = fantasyController;
