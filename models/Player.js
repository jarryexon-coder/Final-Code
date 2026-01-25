import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  // Basic Information
  sport: {
    type: String,
    required: true,
    enum: ['NFL', 'NBA', 'NHL', 'MLB', 'SOCCER']
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  team: {
    type: String,
    required: true,
    index: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  position: {
    type: String,
    required: true,
    index: true
  },
  number: Number,
  
  // Physical Attributes
  age: Number,
  height: String,
  weight: String,
  college: String,
  country: String,
  
  // Performance Metrics
  experience: String,
  status: {
    type: String,
    default: 'Active',
    enum: ['Active', 'Inactive', 'Injured', 'Suspended']
  },
  injuryStatus: String,
  
  // Statistics (embedded document)
  stats: {
    season: String,
    games: Number,
  },
  
  // Advanced Analytics
  advancedStats: mongoose.Schema.Types.Mixed,
  subjectiveStats: mongoose.Schema.Types.Mixed,
  analytics: mongoose.Schema.Types.Mixed,
  
  // Fantasy Sports
  fantasyPoints: Number,
  fantasyRank: Number,
  isPremium: {
    type: Boolean,
    default: false
  },
  
  // Financial
  salary: String,
  contract: String,
  contractValue: String,
  
  // Social/Engagement
  social: {
    twitter: String,
    instagram: String
  },
  highlights: [String],
  
  // Trending/Performance
  trend: {
    type: String,
    enum: ['up', 'down', 'stable']
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  externalId: String // For third-party API references
});

// Compound indexes for common queries
playerSchema.index({ sport: 1, team: 1 });
playerSchema.index({ sport: 1, position: 1 });
playerSchema.index({ sport: 1, fantasyPoints: -1 });
playerSchema.index({ name: 'text', team: 'text', position: 'text' });

playerSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

const Player = mongoose.model('Player', playerSchema);
export default Player;
