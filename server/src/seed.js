require('dotenv').config();
const mongoose = require('mongoose');
const { mongoUri } = require('./config/env');
const Affirmation = require('./models/Affirmation');

const affirmations = [
  { text: 'You are exactly where you need to be.', tags: ['grounding'] },
  { text: 'Your peace is a priority, not a luxury.', tags: ['self-care'] },
  { text: 'Small steps still move you forward.', tags: ['motivation'] },
];

async function seed() {
  await mongoose.connect(mongoUri);

  // assign scheduledDate: today, tomorrow, day after — one per day
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const docs = affirmations.map((a, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return { ...a, scheduledDate: date };
  });

  await Affirmation.deleteMany({}); // clear first so reruns don't collide on unique date
  await Affirmation.insertMany(docs);

  console.log(`Seeded ${docs.length} affirmations`);
  await mongoose.disconnect();
}

seed();