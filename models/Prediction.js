const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  sport: { type: String, required: true, enum: ['NBA', 'NFL', 'NHL'] },
  prediction: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 100 },
  outcome: { type: Boolean }, // true=correct, false=incorrect, null=pending
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prediction', PredictionSchema);
