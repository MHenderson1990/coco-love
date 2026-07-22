let Announcement = require('../models/Announcement');

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