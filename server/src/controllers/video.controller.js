let Video = require('../models/Video');
let User = require('../models/User');
let { EXPLORE_CATEGORIES } = require('../constants/exploreCategories');
let crypto = require('crypto');
let r2 = require('../services/r2.service');

function cleanCategory(category) {
  return EXPLORE_CATEGORIES.includes(category) ? category : 'More';
}

function gate(video, isPaid) {
  // the R2 key never goes to the app; r2 just tells it to ask for a play link
  let { videoKey, ...clean } = video;
  // lean() skips schema defaults, so older videos get their category filled in here
  let withCategory = { ...clean, category: cleanCategory(video.category), r2: !!videoKey };
  let locked = withCategory.tier === 'paid' && !isPaid;
  if (!locked) return { ...withCategory, locked: false };

  // strip the URL so a locked video can't be played even if the app misbehaves
  let { videoUrl, ...rest } = withCategory;
  return { ...rest, locked: true };
}

// POST /api/videos  (admin)
exports.create = async (req, res) => {
  try {
    let { title, description, videoUrl, videoKey, thumbnailUrl, duration, tags, tier, category } = req.body;
    if (!title || (!videoUrl && !videoKey)) {
      return res.status(400).json({ error: 'title and a video file are required' });
    }
    if (videoKey && !String(videoKey).startsWith('video/')) {
      return res.status(400).json({ error: 'Invalid videoKey' });
    }

    let video = await Video.create({
      title, description, videoUrl, videoKey, thumbnailUrl, duration, tags,
      category: cleanCategory(category),
      tier: tier === 'free' ? 'free' : 'paid',
      createdBy: req.user.id,
    });

    let { videoKey: _key, ...safe } = video.toObject();
    res.status(201).json({ video: { ...safe, r2: !!videoKey } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/videos/:id  (admin)
exports.update = async (req, res) => {
  try {
    let { title, description, videoUrl, thumbnailUrl, duration, tags, tier, category } = req.body;

    let updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (videoUrl !== undefined) updates.videoUrl = videoUrl;
    if (thumbnailUrl !== undefined) updates.thumbnailUrl = thumbnailUrl;
    if (duration !== undefined) updates.duration = duration;
    if (tags !== undefined) updates.tags = tags;
    if (category !== undefined) updates.category = cleanCategory(category);
    if (tier !== undefined) updates.tier = tier === 'free' ? 'free' : 'paid';

    let video = await Video.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    let { videoKey, ...safe } = video.toObject();
    res.json({ video: { ...safe, r2: !!videoKey } });
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

    let { videoKey, ...safe } = video;
    res.json({ video: { ...safe, r2: !!videoKey } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/videos/upload-url  (admin) — presigned PUT so the app uploads straight to R2
exports.uploadUrl = async (req, res) => {
  try {
    let ext = String(req.body.ext || 'mp4').toLowerCase().replace('.', '');
    if (!['mp4', 'mov', 'm4v'].includes(ext)) {
      return res.status(400).json({ error: 'Unsupported video type' });
    }
    let key = `video/${crypto.randomUUID()}.${ext}`;
    let signed = await r2.presignUpload(key, 3600);
    res.json(signed);
  } catch (err) {
    console.error('video uploadUrl failed:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/videos/:id/play — playback link, tier-gated (R2 videos get a short-lived signed link)
exports.play = async (req, res) => {
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

    if (video.videoKey) {
      let url = await r2.presignDownload(video.videoKey, 4 * 3600);
      return res.json({ url });
    }
    res.json({ url: video.videoUrl });
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
    if (video.videoKey) await r2.deleteObject(video.videoKey);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};