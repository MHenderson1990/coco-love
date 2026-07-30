const Affirmation = require('../models/Affirmation');


// "Today's message" is anchored to the app's home timezone (Central) so it's the same for
// everyone and flips at Central midnight, not UTC. Maps any instant to the UTC-midnight Date
// representing its Central calendar day.
const HOME_TZ = 'America/Chicago';
function dayAnchor(input) {
  let ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: HOME_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(input));
  return new Date(`${ymd}T00:00:00.000Z`);
}

// GET /api/affirmations/today
exports.getToday = async (req, res) => {
  try {
    let start = dayAnchor(new Date());
    let end = new Date(start.getTime() + 86400000);

    const affirmation = await Affirmation.findOne({
      scheduledDate: { $gte: start, $lt: end },
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
    let end = new Date(dayAnchor(new Date()).getTime() + 86400000);
    const affirmations = await Affirmation.find({ scheduledDate: { $lt: end } })
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

    let date = dayAnchor(scheduledDate);

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
      updates.scheduledDate = dayAnchor(scheduledDate);
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