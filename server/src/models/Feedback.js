let mongoose = require('mongoose');

let feedbackSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  affirmation: { type: mongoose.Schema.Types.ObjectId, ref: 'Affirmation', required: true },
  signal:      { type: String, enum: ['more', 'less'], required: true },
}, { timestamps: true });

feedbackSchema.index({ user: 1, affirmation: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);