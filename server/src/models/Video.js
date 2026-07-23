let mongoose = require('mongoose');

let videoSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, trim: true },
  videoUrl:     { type: String, required: true, trim: true },
  thumbnailUrl: { type: String, trim: true },
  duration:     { type: Number },              // seconds
  tags:         [{ type: String, trim: true }],
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);