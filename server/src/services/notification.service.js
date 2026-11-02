let EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Expo caps at 100 messages per request
function chunk(arr, size) {
  let out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function sendPush(messages) {
  if (!messages.length) return { sent: 0, invalidTokens: [] };

  let sent = 0;
  let invalidTokens = [];
  for (let batch of chunk(messages, 100)) {
    try {
      let res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(batch),
      });
      let data = await res.json();
      sent += batch.length;

      // Expo answers with one ticket per message, in order. DeviceNotRegistered = app uninstalled / token dead
      if (Array.isArray(data?.data)) {
        data.data.forEach((ticket, i) => {
          if (ticket?.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
            invalidTokens.push(batch[i].to);
          }
        });
      }
      console.log('Expo push response:', JSON.stringify(data));
    } catch (err) {
      console.error('Push send failed:', err.message);
    }
  }
  return { sent, invalidTokens };
}

// build one Expo message
function buildMessage(token, title, body, data = {}) {
  return { to: token, sound: 'default', title, body, data };
}

module.exports = { sendPush, buildMessage };