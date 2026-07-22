let mongoose = require('mongoose');

let journalEntrySchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  affirmation: { type: mongoose.Schema.Types.ObjectId, ref: 'Affirmation', required: true },
  mood:        { type: String, trim: true },   // emoji
  text:        { type: String, trim: true },   // written entry
}, { timestamps: true });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);