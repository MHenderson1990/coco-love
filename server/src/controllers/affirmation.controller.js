const Affirmation = require('../models/Affirmation');

// GET /api/affirmations/today
exports.getToday = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const affirmation = await Affirmation.findOne({
      scheduledDate: { $gte: start, $lte: end },
    });

    if (!affirmation) {
      return res.status(404).json({ error: 'No affirmation scheduled for today' });
    }
    res.json({ affirmation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/affirmations/history — past affirmations, newest first
exports.getHistory = async (req, res) => {
  try {
    const now = new Date();
    const affirmations = await Affirmation.find({ scheduledDate: { $lte: now } })
      .sort({ scheduledDate: -1 });
    res.json({ affirmations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/affirmations  (admin)
exports.create = async (req, res) => {
  try {
    let { text, scheduledDate, tags } = req.body;
    if (!text || !scheduledDate) {
      return res.status(400).json({ error: 'text and scheduledDate are required' });
    }

    let date = new Date(scheduledDate);
    date.setHours(0, 0, 0, 0);

    let affirmation = await Affirmation.create({ text, scheduledDate: date, tags });
    res.status(201).json({ affirmation });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An affirmation is already scheduled for that date' });
    }
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/affirmations/:id  (admin)
exports.update = async (req, res) => {
  try {
    let { text, scheduledDate, tags } = req.body;
    let updates = {};
    if (text !== undefined) updates.text = text;
    if (tags !== undefined) updates.tags = tags;
    if (scheduledDate !== undefined) {
      let date = new Date(scheduledDate);
      date.setHours(0, 0, 0, 0);
      updates.scheduledDate = date;
    }

    let affirmation = await Affirmation.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!affirmation) {
      return res.status(404).json({ error: 'Affirmation not found' });
    }
    res.json({ affirmation });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An affirmation is already scheduled for that date' });
    }
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/affirmations/:id  (admin)
exports.remove = async (req, res) => {
  try {
    let affirmation = await Affirmation.findByIdAndDelete(req.params.id);
    if (!affirmation) {
      return res.status(404).json({ error: 'Affirmation not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/affirmations/all  (admin) — includes future ones
exports.listAll = async (req, res) => {
  try {
    let affirmations = await Affirmation.find().sort({ scheduledDate: -1 });
    res.json({ affirmations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};