let JournalEntry = require('../models/JournalEntry');
let crypto = require('crypto');
let User = require('../models/User');
let { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } = require('../config/env');

// POST /api/journal  { affirmationId, mood, text }
// POST /api/journal  { affirmationId?, mood, text, type }
exports.create = async (req, res) => {
  try {
    let { affirmationId, mood, text, type, media } = req.body;

    let entryType = type === 'freeform' ? 'freeform' : 'daily';

    if (entryType === 'daily' && !affirmationId) {
      return res.status(400).json({ error: 'affirmationId is required' });
    }
    if (!mood && !text && (!Array.isArray(media) || media.length === 0)) {
      return res.status(400).json({ error: 'Provide a mood, text, or media' });
    }

    let entry = await JournalEntry.create({
      user: req.user.id,
      affirmation: entryType === 'daily' ? affirmationId : undefined,
      mood,
      text,
      type: entryType,
      media: Array.isArray(media) ? media : [],
    });

    res.status(201).json({ entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/journal — this user's entries, newest first
// GET /api/journal?type=freeform|daily — this user's entries, newest first
exports.list = async (req, res) => {
  try {
    let filter = { user: req.user.id };
    if (req.query.type === 'freeform') {
      filter.type = 'freeform';
    } else if (req.query.type === 'daily') {
      filter.type = { $ne: 'freeform' };   // includes legacy entries with no type
    }

    let entries = await JournalEntry.find(filter)
      .populate('affirmation')
      .sort({ createdAt: -1 });
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/journal/:id
exports.update = async (req, res) => {
  try {
    let { mood, text } = req.body;

    let updates = {};
    if (mood !== undefined) updates.mood = mood;
    if (text !== undefined) updates.text = text;

    // scoped to req.user.id so nobody can edit someone else's entry
    let entry = await JournalEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates,
      { new: true, runValidators: true }
    ).populate('affirmation');

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/journal/:id
exports.remove = async (req, res) => {
  try {
    let entry = await JournalEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/journal/upload-signature  (paid users only)
exports.uploadSignature = async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('tier');
    if (!user || user.tier !== 'paid') {
      return res.status(403).json({ error: 'Media journaling is a members feature' });
    }
    if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
      return res.status(500).json({ error: 'Cloudinary is not configured' });
    }

    let timestamp = Math.round(Date.now() / 1000);
    let folder = 'house-of-love/journal';
    let toSign = `folder=${folder}&timestamp=${timestamp}${cloudinaryApiSecret}`;
    let signature = crypto.createHash('sha1').update(toSign).digest('hex');

    res.json({ signature, timestamp, folder, apiKey: cloudinaryApiKey, cloudName: cloudinaryCloudName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};