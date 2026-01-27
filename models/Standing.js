import mongoose from 'mongoose';

const standingSchema = new mongoose.Schema({
  sport: { type: String, required: true, enum: ['NBA', 'NHL', 'NFL', 'MLB'] },
  season: { type: String, required: true },
  conference: String,
  division: String,
  team: {
    id: String,
    name: String,
    abbreviation: String
  },
  games: {
    played: Number,
    won: Number,
    lost: Number,
    winPercentage: Number
  },
  points: {
    for: Number,
    against: Number,
    differential: Number
  },
  streak: {
    type: String,
    length: Number
  },
  last10: {
    wins: Number,
    losses: Number
  },
  homeRecord: {
    wins: Number,
    losses: Number
  },
  awayRecord: {
    wins: Number,
    losses: Number
  },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true,
  indexes: [
    { sport: 1, season: -1, 'games.winPercentage': -1 },
    { sport: 1, conference: 1, division: 1 }
  ]
});

export default mongoose.model('Standing', standingSchema);
