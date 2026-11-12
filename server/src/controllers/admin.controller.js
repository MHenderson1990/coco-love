let User = require('../models/User');
let Affirmation = require('../models/Affirmation');
let dailyAffirmationJob = require('../jobs/dailyAffirmation.job');
let Setting = require('../models/Setting');
let Favorite = require('../models/Favorite');

// GET /api/admin/stats
exports.stats = async (req, res) => {
  try {
    let [totalUsers, totalAffirmations, activeStreaks, promoUnlocked, paidMembers] = await Promise.all([
      User.countDocuments(),
      Affirmation.countDocuments(),
      User.countDocuments({ currentStreak: { $gt: 0 } }),
      User.countDocuments({ promoUnlockedAt: { $ne: null } }),
      User.countDocuments({ tier: 'paid' }),
    ]);

    res.json({ totalUsers, totalAffirmations, activeStreaks, promoUnlocked, paidMembers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/affirmations/top?limit=10
exports.topAffirmations = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 10;

    let results = await Affirmation.aggregate([
      {
        $lookup: {
          from: 'favorites',
          localField: '_id',
          foreignField: 'affirmation',
          as: 'favorites',
        },
      },
      {
        $lookup: {
          from: 'feedbacks',
          localField: '_id',
          foreignField: 'affirmation',
          as: 'feedback',
        },
      },
      {
        $addFields: {
          favoriteCount: { $size: '$favorites' },
          moreCount: {
            $size: {
              $filter: { input: '$feedback', as: 'f', cond: { $eq: ['$$f.signal', 'more'] } },
            },
          },
          lessCount: {
            $size: {
              $filter: { input: '$feedback', as: 'f', cond: { $eq: ['$$f.signal', 'less'] } },
            },
          },
        },
      },
      {
        $addFields: {
          score: { $subtract: [{ $add: ['$favoriteCount', '$moreCount'] }, '$lessCount'] },
        },
      },
      {
        $project: {
          text: 1,
          scheduledDate: 1,
          favoriteCount: 1,
          moreCount: 1,
          lessCount: 1,
          score: 1,
        },
      },
      { $sort: { score: -1, scheduledDate: -1 } },
      { $limit: limit },
    ]);

    res.json({ affirmations: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.runNotifications = async (req, res) => {
  try {
    await dailyAffirmationJob.runDailyNotifications();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/admin/promo  (admin) — set the shared reward code
exports.setPromo = async (req, res) => {
  try {
    let { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'A code is required' });
    }
    let setting = await Setting.findOneAndUpdate(
      { key: 'promoCode' },
      { value: code.trim() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ code: setting.value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/promo  (admin) — read current code for the dashboard
exports.getPromo = async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'promoCode' });
    res.json({ code: setting?.value || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/affirmations/engagement — every message with saves + feedback, most-saved first
exports.affirmationEngagement = async (req, res) => {
  try {
    let results = await Affirmation.aggregate([
      { $match: { targetUser: null } },
      { $lookup: { from: 'favorites', localField: '_id', foreignField: 'affirmation', as: 'favorites' } },
      { $lookup: { from: 'feedbacks', localField: '_id', foreignField: 'affirmation', as: 'feedback' } },
      {
        $addFields: {
          favoriteCount: { $size: '$favorites' },
          moreCount: { $size: { $filter: { input: '$feedback', as: 'f', cond: { $eq: ['$$f.signal', 'more'] } } } },
          lessCount: { $size: { $filter: { input: '$feedback', as: 'f', cond: { $eq: ['$$f.signal', 'less'] } } } },
        },
      },
      { $project: { text: 1, scheduledDate: 1, favoriteCount: 1, moreCount: 1, lessCount: 1 } },
      { $sort: { favoriteCount: -1, scheduledDate: -1 } },
    ]);
    res.json({ affirmations: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/affirmations/:id/savers — names of users who saved this message
exports.affirmationSavers = async (req, res) => {
  try {
    let favorites = await Favorite.find({ affirmation: req.params.id })
      .populate('user', 'name')          // name ONLY — no email/sensitive fields leave the server
      .sort({ createdAt: -1 });
    let savers = favorites
      .filter((f) => f.user)             // guard against deleted users
      .map((f) => ({ name: f.user.name, savedAt: f.createdAt }));
    res.json({ savers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/users/:id/favorites  (admin) — that user's liked affirmations, for composing a personalized message
exports.userFavorites = async (req, res) => {
  try {
    let favorites = await Favorite.find({ user: req.params.id })
      .populate('affirmation', 'text scheduledDate')
      .sort({ createdAt: -1 });
    let liked = favorites
      .filter((f) => f.affirmation)      // guard against deleted affirmations
      .map((f) => ({
        affirmationId: f.affirmation._id,
        text: f.affirmation.text,
        scheduledDate: f.affirmation.scheduledDate,
        savedAt: f.createdAt,
      }));
    res.json({ liked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/users?search=  (admin) — name/email search for the personalize-message picker
exports.searchUsers = async (req, res) => {
  try {
    let { search } = req.query;
    let query = {};
    if (search) {
      let re = new RegExp(search.trim(), 'i');
      query = { $or: [{ name: re }, { email: re }] };
    }
    let users = await User.find(query)
      .select('name email')
      .sort({ name: 1 })
      .limit(20);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/members?search=&tier=free|paid&page=1  (admin)
exports.listMembers = async (req, res) => {
  try {
    let { search, tier } = req.query;
    let page = Math.max(parseInt(req.query.page) || 1, 1);
    let limit = 50;

    let query = {};
    if (tier === 'free' || tier === 'paid') query.tier = tier;
    if (search && search.trim()) {
      // escape the text so symbols in a search can't break the pattern
      let safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let re = new RegExp(safe, 'i');
      query.$or = [{ name: re }, { email: re }];
    }

    let [members, total] = await Promise.all([
      User.find(query)
        .select('name email tier role createdAt currentStreak longestStreak lastOpenedDate')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({ members, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};