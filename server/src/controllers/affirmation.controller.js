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