import client from './client';

export async function getStats() {
  let res = await client.get('/admin/stats');
  return res.data;
}

export async function getTopAffirmations() {
  let res = await client.get('/admin/affirmations/top');
  return res.data.affirmations;
}

export async function createAffirmation(text, scheduledDate, tags) {
  let res = await client.post('/affirmations', { text, scheduledDate, tags });
  return res.data.affirmation;
}

export async function getUploadSignature() {
  let res = await client.get('/admin/upload-signature');
  return res.data;
}

export async function uploadVideo(fileUri, onProgress) {
  let sig = await getUploadSignature();

  let form = new FormData();
  form.append('file', { uri: fileUri, type: 'video/mp4', name: 'upload.mp4' });
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  // straight to Cloudinary — not through our server
  let res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`,
    { method: 'POST', body: form }
  );

  let data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Upload failed');

  return {
    videoUrl: data.secure_url,
    duration: data.duration ? Math.round(data.duration) : undefined,
    thumbnailUrl: data.secure_url.replace(/\.\w+$/, '.jpg'),
  };
}