const mongoose = require('mongoose');

const fallbackMessageSchema = new mongoose.Schema({
  text:       { type: String, required: true, trim: true },
  tags:       [{ type: String, trim: true }],
  active:     { type: Boolean, default: true },   // Coco can turn one off without deleting it
  lastUsedAt: { type: Date, default: null },      // null = never used, picked first
  useCount:   { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('FallbackMessage', fallbackMessageSchema);