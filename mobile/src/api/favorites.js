import client from './client';

export async function addFavorite(affirmationId) {
  let res = await client.post('/favorites', { affirmationId });
  return res.data.favorite;
}

export async function removeFavorite(affirmationId) {
  await client.delete(`/favorites/${affirmationId}`);
}

export async function listFavorites() {
  let res = await client.get('/favorites');
  return res.data.favorites;
}