import client from './client';

export async function createAnnouncement(title, body) {
  let res = await client.post('/announcements', { title, body });
  return res.data.announcement;
}

export async function listAnnouncements() {
  let res = await client.get('/announcements');
  return res.data.announcements;
}