let cron = require('node-cron');
let User = require('../models/User');
let { sendPush, buildMessage } = require('../services/notification.service');

// current "HH:mm" in a given IANA timezone
function localTime(timezone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

function startOfToday() {
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function runDailyNotifications() {
  let now = new Date();

  let users = await User.find({
    notificationsEnabled: true,
    $or: [
      { pushToken: { $ne: null } },
      { 'pushTokens.0': { $exists: true } },
    ],
  });

  // who is due this minute, in their own timezone
  let candidates = users.filter((user) => {
    let tz = user.timezone || 'America/Chicago';
    try {
      return localTime(tz) === user.notificationTime;
    } catch {
      return false; // bad timezone string, skip
    }
  });

  if (!candidates.length) return;

  // claim each user atomically BEFORE sending. if another run (or another instance)
  // already claimed them today, this update matches nothing and we skip — that's what
  // kills the duplicates even if the job fires several times in the same minute.
  let toSend = [];
  for (let user of candidates) {
    let claimed = await User.findOneAndUpdate(
      {
        _id: user._id,
        $or: [
          { lastNotifiedAt: null },
          { lastNotifiedAt: { $exists: false } },
          { lastNotifiedAt: { $lt: startOfToday() } },
        ],
      },
      { $set: { lastNotifiedAt: now } }
    );
    if (claimed) toSend.push(user);
  }

  if (!toSend.length) return;

  // every device the user has: the list plus the legacy single token, de-duplicated
  let messages = [];
  for (let user of toSend) {
    let tokens = new Set([...(user.pushTokens || []), user.pushToken].filter(Boolean));
    for (let token of tokens) {
      messages.push(
        buildMessage(token, 'Peace and love, friend.', "Ready for today's message?", { type: 'daily' })
      );
    }
  }

  let { invalidTokens } = await sendPush(messages);
  console.log(`Sent ${toSend.length} daily notifications to ${messages.length} devices`);

  // drop tokens Expo says are dead (app uninstalled)
  for (let token of invalidTokens || []) {
    await User.updateMany({ pushTokens: token }, { $pull: { pushTokens: token } }).catch(() => {});
    await User.updateMany({ pushToken: token }, { $unset: { pushToken: '' } }).catch(() => {});
  }
}

// every minute — matches each user's chosen HH:mm in their own timezone
function start() {
  cron.schedule('* * * * *', () => {
    runDailyNotifications().catch((err) =>
      console.error('Daily notification job failed:', err.message)
    );
  });
  console.log('Daily notification job scheduled');
}

module.exports = { start, runDailyNotifications };