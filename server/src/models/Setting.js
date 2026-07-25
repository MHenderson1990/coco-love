let mongoose = require('mongoose');

let settingSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);