import client from './client';

export async function login(email, password) {
  let res = await client.post('/auth/login', { email, password });
  return res.data;
}

export async function signup(email, password, name, birthday) {
  let res = await client.post('/auth/signup', { email, password, name, birthday });
  return res.data;
}

export async function getMe() {
  let res = await client.get('/users/me');
  return res.data.user;
}