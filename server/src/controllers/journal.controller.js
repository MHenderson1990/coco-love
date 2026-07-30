let JournalEntry = require('../models/JournalEntry');
let crypto = require('crypto');
let User = require('../models/User');
let { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } = require('../config/env');
let cloudinaryService = require('../services/cloudinary.service');
let r2 = require('../services/r2.service');

// POST /api/journal  { affirmationId, mood, text }
// POST /api/journal  { affirmationId?, mood, text, type }
exports.create = async (req, res) => {
  try {
    let { affirmationId, mood, text, type, media, voiceNote } = req.body;

    let entryType = type === 'freeform' ? 'freeform' : 'daily';

    if (entryType === 'daily' && !affirmationId) {
      return res.status(400).json({ error: 'affirmationId is required' });
    }
    if (!mood && !text && (!Array.isArray(media) || media.length === 0) && !voiceNote?.key) {
      return res.status(400).json({ error: 'Provide a mood, text, media, or a voice note' });
    }

    let entry = await JournalEntry.create({
      user: req.user.id,
      affirmation: entryType === 'daily' ? affirmationId : undefined,
      mood,
      text,
      type: entryType,
      media: Array.isArray(media) ? media : [],
      voiceNote: voiceNote?.key ? voiceNote : undefined,
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
    if (entry.media?.length) cloudinaryService.destroyMany(entry.media).catch(() => {});
    if (entry.voiceNote?.key) r2.deleteObject(entry.voiceNote.key).catch(() => {});
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

// POST /api/journal/media/destroy  (paid) — remove one uploaded asset from Cloudinary
exports.destroyMedia = async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('tier');
    if (!user || user.tier !== 'paid') {
      return res.status(403).json({ error: 'Members feature' });
    }
    let { publicId, type } = req.body;
    if (!publicId) return res.status(400).json({ error: 'publicId is required' });
    // guard: only journal assets can be destroyed here (not admin videos or anything else)
    if (!publicId.startsWith('house-of-love/journal')) {
      return res.status(400).json({ error: 'Invalid asset' });
    }
    let result = await cloudinaryService.destroy(publicId, type);
    res.json({ result: result?.result || 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/journal/voice/presign-upload  (paid) — get a presigned PUT URL
exports.presignVoiceUpload = async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('tier');
    if (!user || user.tier !== 'paid') return res.status(403).json({ error: 'Members feature' });
    let key = `voice/${req.user.id}/${crypto.randomUUID()}.m4a`;
    let { url } = await r2.presignUpload(key);
    res.json({ url, key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/journal/voice/play?key=...  — presigned GET, scoped to your own recordings
exports.presignVoicePlay = async (req, res) => {
  try {
    let key = req.query.key;
    if (!key) return res.status(400).json({ error: 'key is required' });
    if (!key.startsWith(`voice/${req.user.id}/`)) return res.status(403).json({ error: 'Not allowed' });
    let url = await r2.presignDownload(key);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/journal/voice/destroy — remove a voice object from R2 (own recordings only)
exports.destroyVoice = async (req, res) => {
  try {
    let { key } = req.body;
    if (!key) return res.status(400).json({ error: 'key is required' });
    if (!key.startsWith(`voice/${req.user.id}/`)) return res.status(403).json({ error: 'Not allowed' });
    await r2.deleteObject(key);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};