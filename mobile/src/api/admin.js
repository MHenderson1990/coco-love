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