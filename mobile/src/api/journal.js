import client from './client';

export async function createEntry(affirmationId, mood, text) {
  let res = await client.post('/journal', { affirmationId, mood, text });
  return res.data.entry;
}

export async function listEntries(type) {
  let res = await client.get('/journal', { params: type ? { type } : {} });
  return res.data.entries;
}

export async function createFreeform(mood, text, media) {
  let res = await client.post('/journal', { mood, text, type: 'freeform', media });
  return res.data.entry;
}

export async function updateEntry(id, mood, text) {
  let res = await client.patch(`/journal/${id}`, { mood, text });
  return res.data.entry;
}

export async function deleteEntry(id) {
  await client.delete(`/journal/${id}`);
}

export async function getUploadSignature() {
  let res = await client.get('/journal/upload-signature');
  return res.data;
}

export async function uploadJournalMedia(asset) {
  let sig = await getUploadSignature();
  let kind = asset.type === 'video' ? 'video' : 'image';
  let name = asset.fileName || asset.uri.split('/').pop() || `upload.${kind === 'video' ? 'mp4' : 'jpg'}`;
  let mime = asset.mimeType || (kind === 'video' ? 'video/mp4' : 'image/jpeg');

  let form = new FormData();
  form.append('file', { uri: asset.uri, name, type: mime });
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);

  let res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/${kind}/upload`, {
    method: 'POST',
    body: form,
  });
  let data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || 'Upload failed');
  return { url: data.secure_url, publicId: data.public_id, type: kind };
}

export async function destroyMedia(publicId, type) {
  try {
    await client.post('/journal/media/destroy', { publicId, type });
  } catch (err) {
    // best-effort cleanup
  }
}