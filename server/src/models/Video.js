let mongoose = require('mongoose');
let { EXPLORE_CATEGORIES } = require('../constants/exploreCategories');

let videoSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, trim: true },
  videoUrl:     { type: String, trim: true, required: function () { return !this.videoKey; } },   // old Cloudinary videos
  videoKey:     { type: String, trim: true },                                                      // new videos: R2 object key
  thumbnailUrl: { type: String, trim: true },
  coverKey:     { type: String, trim: true },                                                      // square cover image: R2 object key
  featured:     { type: Boolean, default: false },
  duration:     { type: Number },              // seconds
  category:     { type: String, enum: EXPLORE_CATEGORIES, default: 'More' },
  tags:         [{ type: String, trim: true }],
  tier:         { type: String, enum: ['free', 'paid'], default: 'paid' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);