let Video = require('../models/Video');
let User = require('../models/User');

function gate(video, isPaid) {
  let locked = video.tier === 'paid' && !isPaid;
  if (!locked) return { ...video, locked: false };

  // strip the URL so a locked video can't be played even if the app misbehaves
  let { videoUrl, ...rest } = video;
  return { ...rest, locked: true };
}

// POST /api/videos  (admin)
exports.create = async (req, res) => {
  try {
    let { title, description, videoUrl, thumbnailUrl, duration, tags, tier } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'title and videoUrl are required' });
    }

    let video = await Video.create({
      title, description, videoUrl, thumbnailUrl, duration, tags,
      tier: tier === 'free' ? 'free' : 'paid',
      createdBy: req.user.id,
    });

    res.status(201).json({ video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/videos/:id  (admin)
exports.update = async (req, res) => {
  try {
    let { title, description, videoUrl, thumbnailUrl, duration, tags, tier } = req.body;

    let updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (videoUrl !== undefined) updates.videoUrl = videoUrl;
    if (thumbnailUrl !== undefined) updates.thumbnailUrl = thumbnailUrl;
    if (duration !== undefined) updates.duration = duration;
    if (tags !== undefined) updates.tags = tags;
    if (tier !== undefined) updates.tier = tier === 'free' ? 'free' : 'paid';

    let video = await Video.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json({ video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/videos — library, newest first, gated by tier
exports.list = async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('tier role');
    let isPaid = user?.tier === 'paid' || user?.role === 'admin';

    let videos = await Video.find().sort({ createdAt: -1 }).lean();
    res.json({ videos: videos.map((v) => gate(v, isPaid)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/videos/:id
exports.getOne = async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('tier role');
    let isPaid = user?.tier === 'paid' || user?.role === 'admin';

    let video = await Video.findById(req.params.id).lean();
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.tier === 'paid' && !isPaid) {
      return res.status(403).json({ error: 'This session is for members' });
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