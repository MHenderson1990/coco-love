// Usage (run from the server folder):
//   node scripts/seed-bank.js path/to/messages.txt           (dry run, shows what would be added)
//   node scripts/seed-bank.js path/to/messages.txt --write   (actually adds them)
//
// The text file separates messages with a blank line, so a message can have line breaks inside it.
require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const FallbackMessage = require('../src/models/FallbackMessage');

async function main() {
  let file = process.argv[2];
  let write = process.argv.includes('--write');

  if (!file || file.startsWith('--')) {
    console.error('Usage: node scripts/seed-bank.js <messages.txt> [--write]');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set (check server/.env)');
    process.exit(1);
  }

  let texts = fs.readFileSync(file, 'utf8')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Database: ${mongoose.connection.host} / ${mongoose.connection.name}`);

  let existing = new Set((await FallbackMessage.find({}, 'text')).map((m) => m.text));
  let fresh = [...new Set(texts)].filter((t) => !existing.has(t));

  console.log(`In file: ${texts.length}`);
  console.log(`Already in bank (skipped): ${texts.length - fresh.length}`);
  console.log(`New: ${fresh.length}`);

  if (!write) {
    console.log('\nDry run. Nothing added. Add --write to insert these:\n');
    fresh.forEach((t, i) => console.log(`${i + 1}. ${t}\n`));
  } else if (fresh.length) {
    await FallbackMessage.insertMany(fresh.map((text) => ({ text })));
    console.log(`\nAdded ${fresh.length} messages.`);
  } else {
    console.log('\nNothing new to add.');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});