import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  sport: {
    type: String,
    required: true,
    enum: ['NFL', 'NBA', 'NHL', 'MLB', 'SOCCER']
  },
  externalId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Teams
  homeTeam: {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    abbreviation: String,
    record: String
  },
  awayTeam: {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    abbreviation: String,
    record: String
  },
  
  // Game details
  date: {
    type: Date,
    required: true,
    index: true
  },
  time: String,
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Final', 'Postponed', 'Canceled'],
    default: 'Scheduled'
  },
  
  // Venue
  location: String,
  stadium: String,
  tvNetwork: String,
  
  // Scores
  homeScore: Number,
  awayScore: Number,
  period: String,
  clock: String,
  
  // Odds
  odds: {
    spread: Number,
    overUnder: Number,
    moneylineHome: Number,
    moneylineAway: Number
  },
  
  // Statistics
  stats: mongoose.Schema.Types.Mixed,
  
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
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for common queries
gameSchema.index({ sport: 1, date: 1 });
gameSchema.index({ sport: 1, status: 1 });
gameSchema.index({ sport: 1, 'homeTeam.id': 1, date: 1 });
gameSchema.index({ sport: 1, 'awayTeam.id': 1, date: 1 });
gameSchema.index({ sport: 1, season: 1, week: 1 });

// Update timestamp
gameSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Game = mongoose.model('Game', gameSchema);
export default Game;
