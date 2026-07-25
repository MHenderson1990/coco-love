let User = require('../models/User');
let Setting = require('../models/Setting');

// GET /api/promo — returns the code only if this user has unlocked it
exports.getMyPromo = async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('promoUnlockedAt');
    if (!user?.promoUnlockedAt) {
      return res.status(403).json({ error: 'Reach a 30-day streak to unlock your reward' });
    }
    let setting = await Setting.findOne({ key: 'promoCode' });
    if (!setting?.value) {
      return res.status(404).json({ error: 'No reward is set right now' });
    }
    res.json({ code: setting.value, unlockedAt: user.promoUnlockedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};