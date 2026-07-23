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

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

async function runDailyNotifications() {
  let now = new Date();

  let users = await User.find({
    notificationsEnabled: true,
    pushToken: { $ne: null },
  });

  let due = users.filter((user) => {
    let tz = user.timezone || 'America/Chicago';
    let current;
    try {
      current = localTime(tz);
    } catch {
      return false; // bad timezone string, skip
    }
    if (current !== user.notificationTime) return false;
    if (user.lastNotifiedAt && sameDay(user.lastNotifiedAt, now)) return false;
    return true;
  });

  if (!due.length) return;

  let messages = due.map((user) =>
    buildMessage(
      user.pushToken,
      'Your message is ready',
      `Good morning ${user.name} — are you ready for today's message?`,
      { type: 'daily' }
    )
  );

  await sendPush(messages);

  await User.updateMany(
    { _id: { $in: due.map((u) => u._id) } },
    { $set: { lastNotifiedAt: now } }
  );

  console.log(`Sent ${due.length} daily notifications`);
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