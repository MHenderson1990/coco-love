const User = require('../models/User');
const streakService = require('../services/streak.service');

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

// PATCH /api/users/me
exports.updateMe = async (req, res) => {
  try {
    let { name, birthday, timezone, preferences, pushToken, notificationsEnabled, notificationTime } = req.body;

    let updates = {};
    if (name !== undefined) updates.name = name;
    if (birthday !== undefined) updates.birthday = birthday;
    if (timezone !== undefined) updates.timezone = timezone;
    if (pushToken !== undefined) updates.pushToken = pushToken;
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