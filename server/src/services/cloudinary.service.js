let crypto = require('crypto');
let {
  cloudinaryCloudName,
  cloudinaryApiKey,
  cloudinaryApiSecret,
} = require('../config/env');

// delete one asset by publicId; type is 'image' or 'video'
async function destroy(publicId, type = 'image') {
  if (!publicId) return;
  if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) return;

  let timestamp = Math.round(Date.now() / 1000);
  let toSign = `public_id=${publicId}&timestamp=${timestamp}${cloudinaryApiSecret}`;
  let signature = crypto.createHash('sha1').update(toSign).digest('hex');
  let resourceType = type === 'video' ? 'video' : 'image';

  let body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: cloudinaryApiKey,
    signature,
  });

  try {
    let res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/${resourceType}/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    return await res.json(); // { result: 'ok' | 'not found' }
  } catch (err) {
    console.error('Cloudinary destroy failed:', publicId, err.message);
  }
}

async function destroyMany(mediaArray = []) {
  for (let m of mediaArray) {
    if (m?.publicId) await destroy(m.publicId, m.type);
  }
}

module.exports = { destroy, destroyMany };