let mongoose = require('mongoose');
let { EXPLORE_CATEGORIES } = require('../constants/exploreCategories');

let audioSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  audioKey:    { type: String, required: true, trim: true },   // R2 object key, e.g. audio/<id>.mp3
  duration:    { type: Number },                                // seconds
  category:    { type: String, enum: EXPLORE_CATEGORIES, default: 'More' },
  tier:        { type: String, enum: ['free', 'paid'], default: 'paid' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Audio', audioSchema);