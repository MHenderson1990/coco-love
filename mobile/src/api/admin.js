import client from './client';

export async function getStats() {
  let res = await client.get('/admin/stats');
  return res.data;
}

export async function getTopAffirmations() {
  let res = await client.get('/admin/affirmations/top');
  return res.data.affirmations;
}

export async function createAffirmation(text, scheduledDate, tags, targetUser) {
  let res = await client.post('/affirmations', { text, scheduledDate, tags, targetUser });
  return res.data.affirmation;
}

export async function listAllAffirmations() {
  let res = await client.get('/affirmations/all');
  return res.data.affirmations;
}

export async function updateAffirmation(id, text, scheduledDate, targetUser) {
  let res = await client.patch(`/affirmations/${id}`, { text, scheduledDate, targetUser });
  return res.data.affirmation;
}

export async function deleteAffirmation(id) {
  await client.delete(`/affirmations/${id}`);
}

export async function getPromo() {
  let res = await client.get('/admin/promo');
  return res.data.code;
}

export async function setPromo(code) {
  let res = await client.put('/admin/promo', { code });
  return res.data.code;
}

export async function getEngagement() {
  let res = await client.get('/admin/affirmations/engagement');
  return res.data.affirmations;
}

export async function getSavers(id) {
  let res = await client.get(`/admin/affirmations/${id}/savers`);
  return res.data.savers;
}

export async function searchUsers(search) {
  let res = await client.get('/admin/users', { params: { search } });
  return res.data.users;
}

export async function getUserFavorites(userId) {
  let res = await client.get(`/admin/users/${userId}/favorites`);
  return res.data.liked;
}