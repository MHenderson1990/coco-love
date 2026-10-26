import * as FileSystem from 'expo-file-system/legacy';
import client from './client';

let MIME = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
};

export async function listAudio() {
  let res = await client.get('/audio');
  return res.data.audio;
}

export async function createAudio(payload) {
  let res = await client.post('/audio', payload);
  return res.data.audio;
}

export async function updateAudio(id, updates) {
  let res = await client.patch(`/audio/${id}`, updates);
  return res.data.audio;
}

export async function deleteAudio(id) {
  await client.delete(`/audio/${id}`);
}

export async function getPlayUrl(id) {
  let res = await client.get(`/audio/${id}/play`);
  return res.data.url;
}

// asks the server for a presigned R2 link, then sends the file straight to R2
export async function uploadAudioFile(fileUri, ext) {
  let res = await client.post('/audio/upload-url', { ext });
  let { url, key } = res.data;

  let result = await FileSystem.uploadAsync(url, fileUri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { 'Content-Type': MIME[ext] || 'application/octet-stream' },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Audio upload failed (${result.status})`);
  }
  return key;
}