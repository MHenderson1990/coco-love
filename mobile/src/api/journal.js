import client from './client';

export async function createEntry(affirmationId, mood, text) {
  let res = await client.post('/journal', { affirmationId, mood, text });
  return res.data.entry;
}

export async function listEntries() {
  let res = await client.get('/journal');
  return res.data.entries;
}