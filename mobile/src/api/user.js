import client from './client';

export async function checkIn() {
  let res = await client.post('/users/checkin');
  return res.data;
}

export async function updateMe(updates) {
  let res = await client.patch('/users/me', updates);
  return res.data.user;
}