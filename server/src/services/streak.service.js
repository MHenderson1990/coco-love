let User = require('../models/User');

let PROMO_MILESTONE = 30;

// "YYYY-MM-DD" for a date as seen in the user's timezone.
// Falls back to America/Chicago, and if the timezone string is
// invalid it falls back again to a plain UTC key — never throws.
function dayKey(date, timezone) {
  let tz = timezone || 'America/Chicago';
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(date);
  } catch (err) {
    return new Date(date).toISOString().slice(0, 10);
  }
}

function daysBetweenKeys(a, b) {
  return Math.round((new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z')) / 86400000);
}

async function checkIn(userId) {
  let user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  let now = new Date();
  let todayKey = dayKey(now, user.timezone);

  if (!user.lastOpenedDate) {
    user.currentStreak = 1;
  } else {
    let lastKey = dayKey(user.lastOpenedDate, user.timezone);
    let gap = daysBetweenKeys(todayKey, lastKey);
    if (gap === 0) {
      // same day in the user's timezone — no change
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