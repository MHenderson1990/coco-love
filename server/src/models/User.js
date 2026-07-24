const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['user', 'admin'], default: 'user' },

  name:     { type: String, required: true, trim: true },
  birthday: { type: Date },
  timezone: { type: String, default: 'America/Chicago' },

  currentStreak:   { type: Number, default: 0 },
  longestStreak:   { type: Number, default: 0 },
  lastOpenedDate:  { type: Date },
  promoUnlockedAt: { type: Date },
  lastNotifiedAt: { type: Date },

  preferences: {
    theme:        { type: String, enum: ['light', 'dark'], default: 'light' },
    background:   { type: String, default: 'default' },
    colorPalette: { type: String, enum: ['green', 'blue', 'pink', 'purple'], default: 'purple' },
  },

  pushToken:            { type: String },
  notificationsEnabled: { type: Boolean, default: true },
  notificationTime:     { type: String, default: '08:00' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);