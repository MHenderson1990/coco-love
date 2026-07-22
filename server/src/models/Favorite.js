const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  affirmation: { type: mongoose.Schema.Types.ObjectId, ref: 'Affirmation', required: true },
}, { timestamps: true }); // createdAt = save date

// a user can't favorite the same affirmation twice
favoriteSchema.index({ user: 1, affirmation: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);