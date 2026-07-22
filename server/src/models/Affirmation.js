const mongoose = require('mongoose');

const affirmationSchema = new mongoose.Schema({
  text:          { type: String, required: true, trim: true },
  scheduledDate: { type: Date, required: true, unique: true }, // one per day
  tags:          [{ type: String, trim: true }],               // for "more like this" later
}, { timestamps: true });

module.exports = mongoose.model('Affirmation', affirmationSchema);