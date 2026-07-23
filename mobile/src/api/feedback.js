import client from './client';

export async function sendFeedback(affirmationId, signal) {
  let res = await client.post('/feedback', { affirmationId, signal });
  return res.data.feedback;
}