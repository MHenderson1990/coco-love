const FallbackMessage = require('../models/FallbackMessage');

// GET /api/fallback  (admin)
exports.list = async (req, res) => {
  try {
    let messages = await FallbackMessage.find().sort({ createdAt: -1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/fallback  (admin), body: { texts: ['one', 'two'] } or { text: 'one' }
exports.create = async (req, res) => {
  try {
    let texts = Array.isArray(req.body.texts) ? req.body.texts : [req.body.text];
    texts = texts.map((t) => (typeof t === 'string' ? t.trim() : '')).filter(Boolean);
    if (!texts.length) {
      return res.status(400).json({ error: 'At least one message is required' });
    }
    let messages = await FallbackMessage.insertMany(texts.map((text) => ({ text })));
    res.status(201).json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/fallback/:id  (admin)
exports.update = async (req, res) => {
  try {
    let { text, active } = req.body;
    let updates = {};
    if (text !== undefined) updates.text = text;
    if (active !== undefined) updates.active = !!active;

    let message = await FallbackMessage.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/fallback/:id  (admin)
exports.remove = async (req, res) => {
  try {
    let message = await FallbackMessage.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};