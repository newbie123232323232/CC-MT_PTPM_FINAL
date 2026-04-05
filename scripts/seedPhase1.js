const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');
const User = require('../models/User');
const Movie = require('../models/Movie');
const List = require('../models/List');

const demoMovies = [
  {
    title: 'Taxi Driver 3',
    description: 'Demonstration movie for phase 1 seed data.',
    image: 'https://picsum.photos/seed/taxi3/1200/700',
    imageTitle: 'https://picsum.photos/seed/taxi3-title/500/180',
    imageSmall: 'https://picsum.photos/seed/taxi3-small/320/180',
    trailer:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
    video:
      'https://upload.wikimedia.org/wikipedia/commons/8/87/Schlossbergbahn.webm',
    year: '2024',
    limit: 16,
    genre: 'Action',
    duration: '1h 42m',
    isSeries: false,
  },
  {
    title: 'Wednesday Demo',
    description: 'Demonstration series item for phase 1 seed data.',
    image: 'https://picsum.photos/seed/wed/1200/700',
    imageTitle: 'https://picsum.photos/seed/wed-title/500/180',
    imageSmall: 'https://picsum.photos/seed/wed-small/320/180',
    trailer: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    year: '2023',
    limit: 13,
    genre: 'Fantasy',
    duration: '55m',
    isSeries: true,
  },
  {
    title: 'Project Atlas',
    description: 'Demonstration sci-fi content.',
    image: 'https://picsum.photos/seed/atlas/1200/700',
    imageTitle: 'https://picsum.photos/seed/atlas-title/500/180',
    imageSmall: 'https://picsum.photos/seed/atlas-small/320/180',
    trailer:
      'https://upload.wikimedia.org/wikipedia/commons/1/11/Sintel_movie_720x306.webm',
    video:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
    year: '2022',
    limit: 16,
    genre: 'Sci-Fi',
    duration: '1h 35m',
    isSeries: false,
  },
];

async function seedUser() {
  const existing = await User.findOne({ email: 'seed-admin@zetflix.local' });
  if (existing) return existing;
  const encrypted = CryptoJS.AES.encrypt(
    '12345678',
    process.env.SECRET_KEY
  ).toString();
  return User.create({
    username: 'seed-admin',
    email: 'seed-admin@zetflix.local',
    password: encrypted,
    isAdmin: true,
  });
}

async function seedMovies() {
  const seeded = [];
  for (const item of demoMovies) {
    const found = await Movie.findOne({ title: item.title });
    if (found) {
      seeded.push(found);
    } else {
      seeded.push(await Movie.create(item));
    }
  }
  return seeded;
}

async function seedLists(movies) {
  const movieIds = movies.map((m) => m._id);
  const entries = [
    { title: 'Trending Now', type: 'movie', genre: 'Action', content: movieIds },
    { title: 'TV Dramas', type: 'series', genre: 'Fantasy', content: movieIds },
    { title: 'Recommended For You', type: 'movie', genre: 'Sci-Fi', content: movieIds },
  ];

  for (const row of entries) {
    const found = await List.findOne({ title: row.title });
    if (!found) {
      await List.create(row);
    }
  }
}

async function main() {
  if (!process.env.MONGO_URL || !process.env.SECRET_KEY) {
    throw new Error('MONGO_URL and SECRET_KEY are required in .env');
  }

  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const user = await seedUser();
  const movies = await seedMovies();
  await seedLists(movies);

  console.log('Seed completed.');
  console.log('Admin login: seed-admin@zetflix.local / 12345678');
  console.log('Seed user id:', user._id.toString());
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
