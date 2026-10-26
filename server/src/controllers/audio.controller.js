let crypto = require('crypto');
let Audio = require('../models/Audio');
let User = require('../models/User');
let r2 = require('../services/r2.service');
let { EXPLORE_CATEGORIES } = require('../constants/exploreCategories');

let ALLOWED_EXT = ['mp3', 'm4a', 'aac', 'wav'];

function cleanCategory(category) {
  return EXPLORE_CATEGORIES.includes(category) ? category : 'More';
}

async function isPaidUser(userId) {
  let user = await User.findById(userId).select('tier role');
  return user?.tier === 'paid' || user?.role === 'admin';
}

// the R2 key never goes to the app, only a short-lived play link does
function shape(audio, isPaid) {
  let { audioKey, ...rest } = audio;
  return {
    ...rest,
    category: cleanCategory(audio.category),
    locked: audio.tier === 'paid' && !isPaid,
  };
}

// POST /api/audio/upload-url  (admin) — presigned PUT so the app uploads straight to R2
exports.uploadUrl = async (req, res) => {
  try {
    let ext = String(req.body.ext || 'mp3').toLowerCase().replace('.', '');
    if (!ALLOWED_EXT.includes(ext)) {
      return res.status(400).json({ error: 'Unsupported audio type' });
    }
    let key = `audio/${crypto.randomUUID()}.${ext}`;
    let signed = await r2.presignUpload(key);
    res.json(signed);
  } catch (err) {
    console.error('audio uploadUrl failed:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/audio  (admin)
exports.create = async (req, res) => {
  try {
    let { title, description, audioKey, duration, category, tier } = req.body;
    if (!title || !audioKey) {
      return res.status(400).json({ error: 'title and audioKey are required' });
    }
    if (!String(audioKey).startsWith('audio/')) {
      return res.status(400).json({ error: 'Invalid audioKey' });
    }

    let audio = await Audio.create({
      title, description, audioKey, duration,
      category: cleanCategory(category),
      tier: tier === 'free' ? 'free' : 'paid',
      createdBy: req.user.id,
    });

    let { audioKey: _omit, ...safe } = audio.toObject();
    res.status(201).json({ audio: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/audio/:id  (admin)
exports.update = async (req, res) => {
  try {
    let { title, description, duration, category, tier } = req.body;

    let updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (duration !== undefined) updates.duration = duration;
    if (category !== undefined) updates.category = cleanCategory(category);
    if (tier !== undefined) updates.tier = tier === 'free' ? 'free' : 'paid';

    let audio = await Audio.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!audio) {
      return res.status(404).json({ error: 'Audio not found' });
    }
    let { audioKey, ...safe } = audio;
    res.json({ audio: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/audio — library, newest first
exports.list = async (req, res) => {
  try {
    let isPaid = await isPaidUser(req.user.id);
    let items = await Audio.find().sort({ createdAt: -1 }).lean();
    res.json({ audio: items.map((a) => shape(a, isPaid)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/audio/:id/play — short-lived playback link, tier-gated
exports.play = async (req, res) => {
  try {
    let isPaid = await isPaidUser(req.user.id);
    let audio = await Audio.findById(req.params.id).lean();
    if (!audio) {
      return res.status(404).json({ error: 'Audio not found' });
    }
    if (audio.tier === 'paid' && !isPaid) {
      return res.status(403).json({ error: 'This session is for members' });
    }
    let url = await r2.presignDownload(audio.audioKey);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/audio/:id  (admin)
exports.remove = async (req, res) => {
  try {
    let audio = await Audio.findByIdAndDelete(req.params.id);
    if (!audio) {
      return res.status(404).json({ error: 'Audio not found' });
    }
    await r2.deleteObject(audio.audioKey);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};