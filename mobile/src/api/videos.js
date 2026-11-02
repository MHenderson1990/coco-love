import * as FileSystem from 'expo-file-system/legacy';
import client from './client';

export async function listVideos() {
  let res = await client.get('/videos');
  return res.data.videos;
}

export async function createVideo(payload) {
  let res = await client.post('/videos', payload);
  return res.data.video;
}

export async function deleteVideo(id) {
  await client.delete(`/videos/${id}`);
}

export async function updateVideo(id, updates) {
  let res = await client.patch(`/videos/${id}`, updates);
  return res.data.video;
}

export async function getPlayUrl(id) {
  let res = await client.get(`/videos/${id}/play`);
  return res.data.url;
}

// asks the server for a presigned R2 link, then sends the file straight to R2
export async function uploadVideoFile(fileUri, ext = 'mp4') {
  let res = await client.post('/videos/upload-url', { ext });
  let { url, key } = res.data || {};
  if (!url || !key) throw new Error('No upload link from server: ' + JSON.stringify(res.data));
  if (!fileUri) throw new Error('No video file selected');

  let result = await FileSystem.uploadAsync(url, fileUri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { 'Content-Type': ext === 'mov' ? 'video/quicktime' : 'video/mp4' },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Video upload failed (${result.status})`);
  }
  return key;
}