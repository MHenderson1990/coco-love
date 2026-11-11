// Usage (run from the server folder):
//   node scripts/upload-media.js /path/to/folder/media.json           (dry run)
//   node scripts/upload-media.js /path/to/folder/media.json --write   (upload + add to library)
//
// media.json is a list. File names are relative to the folder media.json is in:
// [
//   { "file": "morning-calm.mp3", "title": "Morning Calm", "description": "A gentle start",
//     "category": "More", "tier": "paid" }
// ]
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const mongoose = require('mongoose');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const r2 = require('../src/services/r2.service');
const Audio = require('../src/models/Audio');
const Video = require('../src/models/Video');
const { EXPLORE_CATEGORIES } = require('../src/constants/exploreCategories');

const AUDIO_TYPES = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.wav': 'audio/wav' };
const VIDEO_TYPES = { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.m4v': 'video/x-m4v' };

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

function getDuration(filePath) {
  try {
    let out = execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', filePath],
      { encoding: 'utf8' }
    );
    let secs = Math.round(parseFloat(out));
    return Number.isFinite(secs) ? secs : undefined;
  } catch (err) {
    return undefined; // ffprobe not installed: duration is left blank
  }
}

async function main() {
  let manifestPath = process.argv[2];
  let write = process.argv.includes('--write');

  if (!manifestPath || manifestPath.startsWith('--')) {
    console.error('Usage: node scripts/upload-media.js <media.json> [--write]');
    process.exit(1);
  }
  for (let k of ['MONGODB_URI', 'R2_ACCOUNT_ID', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']) {
    if (!process.env[k]) {
      console.error(`${k} is not set (check server/.env)`);
      process.exit(1);
    }
  }

  let baseDir = path.dirname(path.resolve(manifestPath));
  let items = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(items)) throw new Error('media.json must be a list');

  // check everything before touching anything
  let plan = [];
  let problems = [];
  for (let [i, it] of items.entries()) {
    let label = `#${i + 1} ${it.file || '(no file)'}`;
    if (!it.file || !it.title) { problems.push(`${label}: file and title are required`); continue; }

    let filePath = path.join(baseDir, it.file);
    if (!fs.existsSync(filePath)) { problems.push(`${label}: file not found at ${filePath}`); continue; }

    let ext = path.extname(it.file).toLowerCase();
    let kind = AUDIO_TYPES[ext] ? 'audio' : VIDEO_TYPES[ext] ? 'video' : null;
    if (!kind) { problems.push(`${label}: unsupported type ${ext}`); continue; }

    let category = it.category;
    if (category && !EXPLORE_CATEGORIES.includes(category)) {
      problems.push(`${label}: category '${category}' is not valid. Use one of: ${EXPLORE_CATEGORIES.join(', ')}`);
      continue;
    }

    plan.push({
      kind, filePath, ext,
      size: fs.statSync(filePath).size,
      contentType: AUDIO_TYPES[ext] || VIDEO_TYPES[ext],
      title: String(it.title).trim(),
      description: it.description ? String(it.description).trim() : undefined,
      category: category || 'More',
      tier: it.tier === 'free' ? 'free' : 'paid',
      duration: getDuration(filePath),
    });
  }

  if (problems.length) {
    console.error('Fix these first, nothing was uploaded:\n');
    problems.forEach((p) => console.error(' - ' + p));
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Database: ${mongoose.connection.host} / ${mongoose.connection.name}\n`);

  let added = 0;
  for (let p of plan) {
    let Model = p.kind === 'audio' ? Audio : Video;
    let mb = (p.size / 1048576).toFixed(1);
    let desc = `${p.kind}  "${p.title}"  ${mb} MB  ${p.category}  ${p.tier}  ${p.duration ? p.duration + 's' : 'no duration'}`;

    if (await Model.exists({ title: p.title })) {
      console.log(`SKIP (title already exists): ${desc}`);
      continue;
    }
    if (!write) {
      console.log(`WOULD ADD: ${desc}`);
      continue;
    }

    let key = `${p.kind}/${crypto.randomUUID()}${p.ext}`;
    process.stdout.write(`Uploading ${desc} ... `);
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: fs.createReadStream(p.filePath),
      ContentLength: p.size,
      ContentType: p.contentType,
    }));

    try {
      let doc = { title: p.title, description: p.description, duration: p.duration, category: p.category, tier: p.tier };
      if (p.kind === 'audio') doc.audioKey = key; else doc.videoKey = key;
      await Model.create(doc);
      added++;
      console.log('done');
    } catch (err) {
      await r2.deleteObject(key); // don't leave an orphan file in R2
      console.log('FAILED, upload removed: ' + err.message);
    }
  }

  console.log(write ? `\nAdded ${added} item(s).` : '\nDry run. Nothing uploaded. Add --write to upload.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});