/**
 * CLI: in ra profiles trong MongoDB (xác nhận đã lưu sau khi tạo từ app).
 * Chạy: npm run db:profiles
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const User = require('../models/User');

async function main() {
  if (!process.env.MONGO_URL) {
    console.error('Thiếu MONGO_URL trong .env');
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const total = await Profile.countDocuments();
  const rows = await Profile.find({})
    .sort({ createdAt: -1 })
    .lean();

  console.log(`profiles collection: ${total} document(s)\n`);

  for (const p of rows) {
    let email = '';
    if (p.userId) {
      const u = await User.findById(p.userId).select('email').lean();
      email = u?.email || String(p.userId);
    }
    console.log(
      [
        `_id: ${p._id}`,
        `name: ${p.name}`,
        `userId → ${email}`,
        `isDefault: ${p.isDefault}`,
        `isKid: ${p.isKid}`,
        `createdAt: ${p.createdAt}`,
      ].join('\n')
    );
    console.log('---');
  }

  if (!rows.length) {
    console.log('(chưa có profile nào — tạo từ app hoặc seed)');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
