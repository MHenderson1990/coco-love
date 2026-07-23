import client from './client';

export async function getToday() {
  let res = await client.get('/affirmations/today');
  return res.data.affirmation;
}

export async function getHistory() {
  let res = await client.get('/affirmations/history');
  return res.data.affirmations;
}