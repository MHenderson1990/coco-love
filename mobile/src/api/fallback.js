import client from './client';

export async function listMessages() {
  let res = await client.get('/fallback');
  return res.data.messages;
}

export async function addMessages(texts) {
  let res = await client.post('/fallback', { texts });
  return res.data.messages;
}

export async function updateMessage(id, updates) {
  let res = await client.patch(`/fallback/${id}`, updates);
  return res.data.message;
}

export async function deleteMessage(id) {
  await client.delete(`/fallback/${id}`);
}