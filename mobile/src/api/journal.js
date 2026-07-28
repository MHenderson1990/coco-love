import client from './client';

export async function createEntry(affirmationId, mood, text) {
  let res = await client.post('/journal', { affirmationId, mood, text });
  return res.data.entry;
}

export async function listEntries(type) {
  let res = await client.get('/journal', { params: type ? { type } : {} });
  return res.data.entries;
}

export async function createFreeform(mood, text) {
  let res = await client.post('/journal', { mood, text, type: 'freeform' });
  return res.data.entry;
}

export async function updateEntry(id, mood, text) {
  let res = await client.patch(`/journal/${id}`, { mood, text });
  return res.data.entry;
}

export async function deleteEntry(id) {
  await client.delete(`/journal/${id}`);
}