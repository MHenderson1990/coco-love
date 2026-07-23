require('dotenv').config();
let mongoose = require('mongoose');
let { mongoUri } = require('./config/env');
let Affirmation = require('./models/Affirmation');
let affirmations = require('./data/affirmations');

async function seed() {
  await mongoose.connect(mongoUri);

  // start the day after the latest scheduled affirmation, or today if none exist
  let latest = await Affirmation.findOne().sort({ scheduledDate: -1 });

  let start = new Date();
  start.setHours(0, 0, 0, 0);
  if (latest) {
    start = new Date(latest.scheduledDate);
    start.setDate(start.getDate() + 1);
  }

  let docs = affirmations.map((a, i) => {
    let date = new Date(start);
    date.setDate(start.getDate() + i);
    return { ...a, scheduledDate: date };
  });

  let inserted = await Affirmation.insertMany(docs);
  console.log(`Seeded ${inserted.length} affirmations starting ${start.toDateString()}`);

  await mongoose.disconnect();
}

seed();