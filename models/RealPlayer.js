import mongoose from 'mongoose';

const realPlayerSchema = new mongoose.Schema({
  sport: { type: String, required: true, enum: ['NBA', 'NHL', 'NFL', 'MLB'] },
  externalId: { type: String, required: true },
  name: { type: String, required: true },
  position: String,
  team: {
    id: String,
    name: String,
    abbreviation: String
  },
  stats: {
    season: {
      games: Number,
      points: Number,
      rebounds: Number,
      assists: Number,
      steals: Number,
      blocks: Number,
      fieldGoalPercentage: Number,
      threePointPercentage: Number,
      freeThrowPercentage: Number,
      minutes: Number
    },
    last5: [{
      date: Date,
      points: Number,
      rebounds: Number,
      assists: Number
    }],
    fantasy: {
      fanduel: {
        salary: Number,
        projection: Number,
        value: Number
      },
      draftkings: {
        salary: Number,
        projection: Number,
        value: Number
      }
    }
  },
  injury: {
    status: { type: String, enum: ['ACTIVE', 'OUT', 'GTD', 'DOUBTFUL'] },
    details: String,
    updated: Date
  },
  lastUpdated: { type: Date, default: Date.now },
  source: { type: String, default: 'sportsdata.io' }
}, {
  timestamps: true,
  indexes: [
    { sport: 1, name: 1 },
    { sport: 1, 'team.id': 1 },
    { 'stats.fantasy.fanduel.value': -1 }
  ]
});

export default mongoose.model('RealPlayer', realPlayerSchema);
