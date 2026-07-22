let mongoose = require('mongoose');

let announcementSchema = new mongoose.Schema({
  title:     { type: String, required: true, trim: true },
  body:      { type: String, required: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);