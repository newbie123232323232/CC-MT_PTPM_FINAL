const mongoose = require('mongoose');

/** Một lần bắt đầu xem phim (movie) — dùng cho trending theo cửa sổ thời gian. */
const ViewEventSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
    },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

ViewEventSchema.index({ at: 1 }, { expireAfterSeconds: 15 * 24 * 60 * 60 });

module.exports = mongoose.model('ViewEvent', ViewEventSchema);
