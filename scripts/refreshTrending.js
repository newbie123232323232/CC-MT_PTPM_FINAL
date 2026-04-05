const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { refreshTrendingNowFromViews } = require('../services/trendingRefresh');

async function main() {
  if (!process.env.MONGO_URL) throw new Error('MONGO_URL required');
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const r = await refreshTrendingNowFromViews();
  console.log(r);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
