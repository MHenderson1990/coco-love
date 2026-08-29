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

let crypto = require('crypto');
let {
  cloudinaryCloudName,
  cloudinaryApiKey,
  cloudinaryApiSecret,
} = require('../config/env');

// GET /api/admin/upload-signature  (admin)
exports.uploadSignature = async (req, res) => {
  try {
    if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
      return res.status(500).json({ error: 'Cloudinary is not configured' });
    }

    let timestamp = Math.round(Date.now() / 1000);
    let folder = 'house-of-love/videos';

    // params must be sorted alphabetically, joined, then the secret appended
    let toSign = `folder=${folder}&timestamp=${timestamp}${cloudinaryApiSecret}`;
    let signature = crypto.createHash('sha1').update(toSign).digest('hex');

    res.json({
      signature,
      timestamp,
      folder,
      apiKey: cloudinaryApiKey,
      cloudName: cloudinaryCloudName,
    });
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