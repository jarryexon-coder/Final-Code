import mongoose from 'mongoose';

const generationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  generationType: {
    type: String,
    enum: ['daily', 'custom', 'quick', 'advanced', 'ai'],
    required: true
  },
  
  sport: {
    type: String,
    enum: ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'All'],
    required: true
  },
  
  parameters: {
    winnersPerSelection: {
      type: Number,
      default: 3
    },
    selectionsCount: {
      type: Number,
      default: 2
    },
    minConfidence: Number,
    maxConfidence: Number,
    minEdgeScore: Number,
    maxEdgeScore: Number,
    bumpRisk: String,
    customPrompt: String
  },
  
  generatedSelections: [{
    selectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Selection'
    },
    selectionData: mongoose.Schema.Types.Mixed
  }],
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  error: {
    code: String,
    message: String
  },
  
  duration: Number,
  
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  dailyReset: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Generation = mongoose.model('Generation', generationSchema);
export default Generation;
