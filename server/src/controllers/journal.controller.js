let JournalEntry = require('../models/JournalEntry');

// POST /api/journal  { affirmationId, mood, text }
exports.create = async (req, res) => {
  try {
    let { affirmationId, mood, text } = req.body;
    if (!affirmationId) {
      return res.status(400).json({ error: 'affirmationId is required' });
    }
    if (!mood && !text) {
      return res.status(400).json({ error: 'Provide a mood, text, or both' });
    }

    let entry = await JournalEntry.create({
      user: req.user.id,
      affirmation: affirmationId,
      mood,
      text,
    });

    res.status(201).json({ entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/journal — this user's entries, newest first
exports.list = async (req, res) => {
  try {
    let entries = await JournalEntry.find({ user: req.user.id })
      .populate('affirmation')
      .sort({ createdAt: -1 });
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};