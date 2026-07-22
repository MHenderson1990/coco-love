const User = require('../models/User');

const PROMO_MILESTONE = 30;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / (1000 * 60 * 60 * 24));
}

async function checkIn(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date();

  if (!user.lastOpenedDate) {
    user.currentStreak = 1;
  } else {
    const gap = daysBetween(user.lastOpenedDate, now);
    if (gap === 0) {
      // already opened today — no change
    } else if (gap === 1) {
      user.currentStreak += 1;
    } else {
      user.currentStreak = 1; // missed a day → reset
    }
  }

  if (user.currentStreak > user.longestStreak) {
    user.longestStreak = user.currentStreak;
  }

  let promoJustUnlocked = false;
  if (user.currentStreak >= PROMO_MILESTONE && !user.promoUnlockedAt) {
    user.promoUnlockedAt = now;
    promoJustUnlocked = true;
  }

  user.lastOpenedDate = now;
  await user.save();

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    promoUnlockedAt: user.promoUnlockedAt,
    promoJustUnlocked,
  };
}

module.exports = { checkIn };