import client from './client';

export async function listVideos() {
  let res = await client.get('/videos');
  return res.data.videos;
}