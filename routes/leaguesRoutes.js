import express from 'express';
import Team from '../models/Team.js';
import Player from '../models/Player.js';

const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "leagues API",
    timestamp: new Date().toISOString(),
    endpoints: []
  });
});

// GET /api/leagues/:sport/standings - Get league standings
router.get('/:sport/standings', async (req, res) => {
  try {
    const { sport } = req.params;
    const { 
      groupBy = 'conference',
      season = '2024'
    } = req.query;
    
    // Get all teams for the sport
    const teams = await Team.find({ sport: sport.toUpperCase() })
      .select('name city conference division stadium record colors logoUrl')
      .lean();
    
    if (teams.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No teams found for ${sport}`
      });
    }
    
    // Sort teams by win percentage
    const sortedTeams = [...teams].sort((a, b) => {
      const winPctA = a.record?.winPercentage || 0;
      const winPctB = b.record?.winPercentage || 0;
      return winPctB - winPctA;
    });
    
    let standings;
    
    switch (groupBy) {
      case 'conference':
        standings = groupStandingsByConference(sortedTeams);
        break;
      case 'division':
        standings = groupStandingsByDivision(sortedTeams);
        break;
      case 'league':
      default:
        standings = {
          league: sortedTeams.map((team, index) => ({
            ...team,
            leagueRank: index + 1,
            gamesBack: calculateGamesBack(team.record, sortedTeams[0].record)
          }))
        };
        break;
    }
    
    // Get playoff picture
    const playoffPicture = getPlayoffPicture(sortedTeams, sport);
    
    // Get recent champions
    const recentChampions = getRecentChampions(sport);
    
    res.json({
      success: true,
      sport,
      season,
      groupBy,
      standings,
      playoffPicture,
      recentChampions,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching league standings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch league standings'
    });
  }
});

// Helper function to group standings by conference
function groupStandingsByConference(teams) {
  const conferences = {};
  
  teams.forEach(team => {
    const conference = team.conference || 'Unknown';
    if (!conferences[conference]) {
      conferences[conference] = [];
    }
    
    const conferenceLeader = conferences[conference][0];
    const gamesBack = conferenceLeader ? 
      calculateGamesBack(team.record, conferenceLeader.record) : 0;
    
    conferences[conference].push({
      ...team,
      gamesBack
    });
  });
  
  // Sort within each conference
  Object.keys(conferences).forEach(conference => {
    conferences[conference].sort((a, b) => {
      const winPctA = a.record?.winPercentage || 0;
      const winPctB = b.record?.winPercentage || 0;
      return winPctB - winPctA;
    });
    
    // Add rank
    conferences[conference] = conferences[conference].map((team, index) => ({
      ...team,
      conferenceRank: index + 1,
      playoffStatus: index < 8 ? 'In Playoffs' : 'Out of Playoffs'
    }));
  });
  
  return conferences;
}

// Helper function to calculate games back
function calculateGamesBack(teamRecord, leaderRecord) {
  if (!teamRecord || !leaderRecord) return 0;
  
  const teamWins = teamRecord.wins || 0;
  const teamLosses = teamRecord.losses || 0;
  const leaderWins = leaderRecord.wins || 0;
  const leaderLosses = leaderRecord.losses || 0;
  
  const gamesBehind = ((leaderWins - teamWins) + (teamLosses - leaderLosses)) / 2;
  return Math.max(0, gamesBehind);
}

// Helper function to get playoff picture
function getPlayoffPicture(teams, sport) {
  const conferences = {};
  teams.forEach(team => {
    const conference = team.conference || 'Eastern';
    if (!conferences[conference]) {
      conferences[conference] = [];
    }
    conferences[conference].push(team);
  });
  
  const playoffPicture = {};
  
  Object.keys(conferences).forEach(conference => {
    const conferenceTeams = [...conferences[conference]]
      .sort((a, b) => {
        const winPctA = a.record?.winPercentage || 0;
        const winPctB = b.record?.winPercentage || 0;
        return winPctB - winPctA;
      })
      .slice(0, 8);
    
    playoffPicture[conference] = conferenceTeams.map((team, index) => ({
      seed: index + 1,
      team: team.name,
      record: `${team.record?.wins || 0}-${team.record?.losses || 0}`,
      winPercentage: (team.record?.winPercentage || 0).toFixed(3),
      last10: team.record?.last10 || '5-5',
      streak: team.record?.streak || 'W1'
    }));
  });
  
  return {
    playoffSeeds: playoffPicture,
    playoffFormat: sport === 'NBA' ? 
      'Top 6 seeds guaranteed, seeds 7-10 in play-in tournament' :
      'Top 7 seeds per conference make playoffs'
  };
}

// Helper function to get recent champions
function getRecentChampions(sport) {
  const champions = {
    NBA: [
      { year: 2023, champion: 'Denver Nuggets', runnerUp: 'Miami Heat', mvp: 'Nikola Jokic' },
      { year: 2022, champion: 'Golden State Warriors', runnerUp: 'Boston Celtics', mvp: 'Stephen Curry' },
      { year: 2021, champion: 'Milwaukee Bucks', runnerUp: 'Phoenix Suns', mvp: 'Giannis Antetokounmpo' },
      { year: 2020, champion: 'Los Angeles Lakers', runnerUp: 'Miami Heat', mvp: 'LeBron James' },
      { year: 2019, champion: 'Toronto Raptors', runnerUp: 'Golden State Warriors', mvp: 'Kawhi Leonard' }
    ],
    NFL: [
      { year: 2023, champion: 'Kansas City Chiefs', runnerUp: 'Philadelphia Eagles', mvp: 'Patrick Mahomes' },
      { year: 2022, champion: 'Los Angeles Rams', runnerUp: 'Cincinnati Bengals', mvp: 'Cooper Kupp' },
      { year: 2021, champion: 'Tampa Bay Buccaneers', runnerUp: 'Kansas City Chiefs', mvp: 'Tom Brady' },
      { year: 2020, champion: 'Kansas City Chiefs', runnerUp: 'San Francisco 49ers', mvp: 'Patrick Mahomes' },
      { year: 2019, champion: 'New England Patriots', runnerUp: 'Los Angeles Rams', mvp: 'Julian Edelman' }
    ]
  };
  
  return champions[sport] || [];
}

export default router;
