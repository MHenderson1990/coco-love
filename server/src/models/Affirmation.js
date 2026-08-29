const mongoose = require('mongoose');

const affirmationSchema = new mongoose.Schema({
  text:          { type: String, required: true, trim: true },
  scheduledDate: { type: Date, required: true }, // one shared per day, or one per (day + targetUser)
  targetUser:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = shared/global; set = personalized for that user
  tags:          [{ type: String, trim: true }],               // for "more like this" later
}, { timestamps: true });

affirmationSchema.index({ scheduledDate: 1, targetUser: 1 }, { unique: true });

module.exports = mongoose.model('Affirmation', affirmationSchema);