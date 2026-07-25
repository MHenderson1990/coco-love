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