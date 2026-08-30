const User = require('../models/User');
const streakService = require('../services/streak.service');
const crypto = require('crypto');
const {
  cloudinaryCloudName,
  cloudinaryApiKey,
  cloudinaryApiSecret,
} = require('../config/env');

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.checkIn = async (req, res) => {
  try {
    const result = await streakService.checkIn(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/users/me/upload-signature — for uploading a custom Today-screen background photo
exports.uploadSignature = async (req, res) => {
  try {
    if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
      return res.status(500).json({ error: 'Cloudinary is not configured' });
    }

    let timestamp = Math.round(Date.now() / 1000);
    let folder = `house-of-love/backgrounds/${req.user.id}`;

    let toSign = `folder=${folder}&timestamp=${timestamp}${cloudinaryApiSecret}`;
    let signature = crypto.createHash('sha1').update(toSign).digest('hex');

    res.json({
      signature,
      timestamp,
      folder,
      apiKey: cloudinaryApiKey,
      cloudName: cloudinaryCloudName,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/users/me
exports.updateMe = async (req, res) => {
  try {
    let { name, birthday, timezone, preferences, pushToken, notificationsEnabled, notificationTime } = req.body;

    let updates = {};
    if (name !== undefined) updates.name = name;
    if (birthday !== undefined) updates.birthday = birthday;
    if (timezone !== undefined) updates.timezone = timezone;
    if (pushToken) {
      await User.updateMany(
        { pushToken, _id: { $ne: req.user.id } },
        { $unset: { pushToken: '' } }
      );
      updates.pushToken = pushToken; // ← actually save it on the current user
    }
    if (notificationsEnabled !== undefined) updates.notificationsEnabled = notificationsEnabled;

    if (notificationTime !== undefined) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(notificationTime)) {
        return res.status(400).json({ error: 'notificationTime must be "HH:mm"' });
      }
      updates.notificationTime = notificationTime;
    }

    // dot-notation so a partial preferences object doesn't wipe the others
    if (preferences !== undefined) {
      if (preferences.theme !== undefined) updates['preferences.theme'] = preferences.theme;
      if (preferences.background !== undefined) updates['preferences.background'] = preferences.background;
      if (preferences.colorPalette !== undefined) updates['preferences.colorPalette'] = preferences.colorPalette;
      if (preferences.todayPhoto !== undefined) updates['preferences.todayPhoto'] = preferences.todayPhoto;
    }

    let user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};