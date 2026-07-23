let Video = require('../models/Video');

// POST /api/videos  (admin)
exports.create = async (req, res) => {
  try {
    let { title, description, videoUrl, thumbnailUrl, duration, tags } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'title and videoUrl are required' });
    }

    let video = await Video.create({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      tags,
      createdBy: req.user.id,
    });

    res.status(201).json({ video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/videos — library, newest first
exports.list = async (req, res) => {
  try {
    let videos = await Video.find().sort({ createdAt: -1 });
    res.json({ videos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/videos/:id
exports.getOne = async (req, res) => {
  try {
    let video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json({ video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/videos/:id  (admin)
exports.remove = async (req, res) => {
  try {
    let video = await Video.findByIdAndDelete(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};