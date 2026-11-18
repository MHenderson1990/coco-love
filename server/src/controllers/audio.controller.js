let crypto = require('crypto');
let Audio = require('../models/Audio');
let User = require('../models/User');
let r2 = require('../services/r2.service');
let { EXPLORE_CATEGORIES } = require('../constants/exploreCategories');
const { resolveTitle } = require('../utils/title');
let { clearFeatured } = require('../utils/featured');

let ALLOWED_EXT = ['mp3', 'm4a', 'aac', 'wav'];

function cleanCategory(category) {
  return EXPLORE_CATEGORIES.includes(category) ? category : 'More';
}

async function isPaidUser(userId) {
  let user = await User.findById(userId).select('tier role');
  return user?.tier === 'paid' || user?.role === 'admin';
}

// the R2 keys never go to the app, only short-lived links do
async function shape(audio, isPaid) {
  let { audioKey, coverKey, ...rest } = audio;
  return {
    ...rest,
    category: cleanCategory(audio.category),
    locked: audio.tier === 'paid' && !isPaid,
    coverUrl: coverKey ? await r2.presignDownload(coverKey) : null,
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

// POST /api/audio/cover-url  (admin) — presigned PUT for a square cover image
exports.coverUrl = async (req, res) => {
  try {
    let key = `cover/${crypto.randomUUID()}.jpg`;
    let signed = await r2.presignUpload(key);
    res.json(signed);
  } catch (err) {
    console.error('audio coverUrl failed:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/audio  (admin)
exports.create = async (req, res) => {
  try {
    let { title, description, audioKey, coverKey, duration, category, tier } = req.body;
    title = resolveTitle(title, description);
    if (!title || !audioKey) {
      return res.status(400).json({ error: 'a title or description, and an audioKey, are required' });
    }
    if (!String(audioKey).startsWith('audio/')) {
      return res.status(400).json({ error: 'Invalid audioKey' });
    }
    if (coverKey && !String(coverKey).startsWith('cover/')) {
      return res.status(400).json({ error: 'Invalid coverKey' });
    }

    let audio = await Audio.create({
      title, description, audioKey, duration,
      coverKey: coverKey || undefined,
      category: cleanCategory(category),
      tier: tier === 'free' ? 'free' : 'paid',
      createdBy: req.user.id,
    });

    res.status(201).json({ audio: await shape(audio.toObject(), true) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/audio/:id  (admin)
exports.update = async (req, res) => {
  try {
    let { title, description, duration, category, tier, coverKey, featured } = req.body;

    let existing = await Audio.findById(req.params.id).select('coverKey');
    if (!existing) {
      return res.status(404).json({ error: 'Audio not found' });
    }

    let updates = {};
    let nextTitle = resolveTitle(title, description);
    if (title !== undefined && nextTitle) updates.title = nextTitle;
    if (description !== undefined) updates.description = description;
    if (duration !== undefined) updates.duration = duration;
    if (category !== undefined) updates.category = cleanCategory(category);
    if (tier !== undefined) updates.tier = tier === 'free' ? 'free' : 'paid';
    if (featured !== undefined) updates.featured = !!featured;
    if (coverKey !== undefined) {
      if (coverKey && !String(coverKey).startsWith('cover/')) {
        return res.status(400).json({ error: 'Invalid coverKey' });
      }
      updates.coverKey = coverKey || null;
    }

    let audio = await Audio.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (updates.featured) await clearFeatured(audio._id);
    if (coverKey !== undefined && existing.coverKey && existing.coverKey !== updates.coverKey) {
      await r2.deleteObject(existing.coverKey).catch(() => {});
    }

    res.json({ audio: await shape(audio, true) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/audio — library, newest first
exports.list = async (req, res) => {
  try {
    let isPaid = await isPaidUser(req.user.id);
    let items = await Audio.find().sort({ createdAt: -1 }).lean();
    res.json({ audio: await Promise.all(items.map((a) => shape(a, isPaid))) });
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
    if (audio.coverKey) await r2.deleteObject(audio.coverKey).catch(() => {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};