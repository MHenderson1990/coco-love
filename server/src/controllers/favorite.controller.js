const Favorite = require('../models/Favorite');

// POST /api/favorites  { affirmationId }
exports.add = async (req, res) => {
  try {
    const { affirmationId } = req.body;
    if (!affirmationId) {
      return res.status(400).json({ error: 'affirmationId is required' });
    }
    const favorite = await Favorite.create({
      user: req.user.id,
      affirmation: affirmationId,
    });
    res.status(201).json({ favorite });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Already favorited' });
    }
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/favorites/:affirmationId
exports.remove = async (req, res) => {
  try {
    const result = await Favorite.findOneAndDelete({
      user: req.user.id,
      affirmation: req.params.affirmationId,
    });
    if (!result) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/favorites — list this user's favorites, newest first
exports.list = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id })
      .populate('affirmation')
      .sort({ createdAt: -1 });
    res.json({ favorites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};