import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  sport: {
    type: String,
    required: true,
    enum: ['NBA', 'NHL', 'NFL', 'MLB', 'SOCCER']
  },
  externalId: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Live', 'Final', 'Postponed', 'Canceled', 'In Progress'],
    default: 'Scheduled'
  },
  
  // Teams - integrating both structures
  homeTeam: {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    abbreviation: String,
    record: String,
    score: Number  // From File 1
  },
  awayTeam: {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    abbreviation: String,
    record: String,
    score: Number  // From File 1
  },
  
  // Game details
  time: String,
  
  // Venue - merging venue information
  venue: String,      // From File 1
  stadium: String,    // Equivalent to venue from File 1
  location: String,
  broadcast: String,  // From File 1
  tvNetwork: String,  // Equivalent to broadcast from File 1
  
  // Scores - keeping both scoring approaches but making them consistent
  homeScore: Number,
  awayScore: Number,
  period: String,
  clock: String,
  
  // Odds - merging odds structures
  odds: {
    home: Number,           // From File 1 (moneylineHome equivalent)
    away: Number,           // From File 1 (moneylineAway equivalent)
    spread: Number,
    overUnder: Number,
    moneylineHome: Number,  // Keeping original
    moneylineAway: Number   // Keeping original
  },
  
  // Statistics - integrating detailed stats from File 1 with flexibility of File 2
  stats: {
    home: {
      fieldGoalPercentage: Number,
      threePointPercentage: Number,
      freeThrowPercentage: Number,
      rebounds: Number,
      assists: Number,
      turnovers: Number
    },
    away: {
      fieldGoalPercentage: Number,
      threePointPercentage: Number,
      freeThrowPercentage: Number,
      rebounds: Number,
      assists: Number,
      turnovers: Number
    }
  },
  
  // Game events
  events: [{
    type: String,
    time: String,
    description: String
  }],
  
  // Metadata
  season: String,
  week: Number,
  gameType: {
    type: String,
    enum: ['Regular', 'Playoff', 'Preseason', 'All-Star']
  },
  attendance: Number,
  
  // Timestamps
  lastUpdated: { type: Date, default: Date.now },  // From File 1
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Source information
  source: { type: String, default: 'sportsdata.io' }  // From File 1
}, {
  timestamps: true,  // This will automatically handle createdAt and updatedAt
  indexes: [
    { sport: 1, date: 1 },
    { sport: 1, status: 1 },
    { 'homeTeam.id': 1, 'awayTeam.id': 1 },
    { sport: 1, 'homeTeam.id': 1, date: 1 },
    { sport: 1, 'awayTeam.id': 1, date: 1 },
    { sport: 1, season: 1, week: 1 }
  ]
});

// Update timestamp middleware
gameSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.lastUpdated = Date.now();  // Also update lastUpdated from File 1
  next();
});

const Game = mongoose.model('Game', gameSchema);
export default Game;
