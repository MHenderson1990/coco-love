let mongoose = require('mongoose');

let journalEntrySchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  affirmation: { type: mongoose.Schema.Types.ObjectId, ref: 'Affirmation' },
  mood:        { type: String, trim: true },   // emoji
  text:        { type: String, trim: true },   // written entry
  type:        { type: String, enum: ['daily', 'freeform'], default: 'daily' },
  media: [{
    url:      { type: String, required: true },
    publicId: { type: String },
    type:     { type: String, enum: ['image', 'video'], required: true },
  }],
  voiceNote: {
    key: { type: String },
    durationMillis: { type: Number },
  },
}, { timestamps: true });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);