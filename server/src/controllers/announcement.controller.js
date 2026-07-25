let Announcement = require('../models/Announcement');
let User = require('../models/User');
let { sendPush, buildMessage } = require('../services/notification.service');

// POST /api/announcements  (admin)  { title, body }
exports.create = async (req, res) => {
  try {
    let { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'title and body are required' });
    }
    let announcement = await Announcement.create({
      title,
      body,
      createdBy: req.user.id,
    });

    let recipients = await User.find({ notificationsEnabled: true, pushToken: { $ne: null } });
    let messages = recipients.map((user) =>
      buildMessage(user.pushToken, title, body, { type: 'announcement' })
    );
    await sendPush(messages);

    res.status(201).json({ announcement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/announcements — all users, newest first
exports.list = async (req, res) => {
  try {
    let announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};