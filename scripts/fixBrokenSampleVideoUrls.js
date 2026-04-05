/**
 * URL Google gtv-videos-bucket đã 403 (AccessDenied). Sửa document Movie trong DB.
 * Chạy: node scripts/fixBrokenSampleVideoUrls.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Movie = require('../models/Movie');

const GTV = /commondatastorage\.googleapis\.com\/gtv-videos-bucket/i;

const FALLBACK =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm';

const BY_TITLE = {
  'Taxi Driver 3': {
    trailer:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
    video:
      'https://upload.wikimedia.org/wikipedia/commons/8/87/Schlossbergbahn.webm',
  },
  'Wednesday Demo': {
    trailer:
      'https://upload.wikimedia.org/wikipedia/commons/8/87/Schlossbergbahn.webm',
    video:
      'https://upload.wikimedia.org/wikipedia/commons/1/11/Sintel_movie_720x306.webm',
  },
  'Project Atlas': {
    trailer:
      'https://upload.wikimedia.org/wikipedia/commons/1/11/Sintel_movie_720x306.webm',
    video:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
  },
};

async function main() {
  if (!process.env.MONGO_URL) {
    throw new Error('MONGO_URL required in .env');
  }
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  let n = 0;
  for (const [title, urls] of Object.entries(BY_TITLE)) {
    const r = await Movie.updateOne(
      { title },
      { $set: { trailer: urls.trailer, video: urls.video } }
    );
    if (r.matchedCount) {
      n += 1;
      console.log('Updated by title:', title);
    }
  }

  const docs = await Movie.find({
    $or: [{ video: GTV }, { trailer: GTV }],
  }).lean();

  for (const doc of docs) {
    const set = {};
    if (doc.video && GTV.test(doc.video)) set.video = FALLBACK;
    if (doc.trailer && GTV.test(doc.trailer)) set.trailer = FALLBACK;
    if (Object.keys(set).length) {
      await Movie.updateOne({ _id: doc._id }, { $set: set });
      n += 1;
      console.log('Updated by URL pattern:', doc.title || doc._id);
    }
  }

  console.log('Done. Updates applied:', n);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
