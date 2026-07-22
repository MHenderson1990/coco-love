let Feedback = require('../models/Feedback');

// POST /api/feedback  { affirmationId, signal }
exports.submit = async (req, res) => {
  try {
    let { affirmationId, signal } = req.body;
    if (!affirmationId || !['more', 'less'].includes(signal)) {
      return res.status(400).json({ error: 'affirmationId and signal ("more" or "less") are required' });
    }

    // upsert: one feedback per user per affirmation, changeable more <-> less
    let feedback = await Feedback.findOneAndUpdate(
      { user: req.user.id, affirmation: affirmationId },
      { signal },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};