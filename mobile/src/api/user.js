import client from './client';

export async function checkIn() {
  let res = await client.post('/users/checkin');
  return res.data;
}

export async function updateMe(updates) {
  let res = await client.patch('/users/me', updates);
  return res.data.user;
}

export async function getUploadSignature() {
  let res = await client.get('/users/me/upload-signature');
  return res.data;
}

export async function uploadTodayPhoto(fileUri) {
  let sig = await getUploadSignature();

  let form = new FormData();
  form.append('file', { uri: fileUri, type: 'image/jpeg', name: 'upload.jpg' });
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  let res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: 'POST', body: form }
  );

  let data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Upload failed');

  return data.secure_url;
}

export async function getMyPromo() {
  let res = await client.get('/promo');
  return res.data; // { code, unlockedAt }
}