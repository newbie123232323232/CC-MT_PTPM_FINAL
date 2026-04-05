const mongoose = require('mongoose');

const WatchHistorySchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    contentType: { type: String, enum: ['movie', 'episode'], default: 'movie' },
    seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
    seasonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Season' },
    watchedAt: { type: Date, default: Date.now },
    positionSec: { type: Number, default: 0 },
    durationSec: { type: Number, default: 0 },
  },
  { timestamps: true }
);

WatchHistorySchema.index({ profileId: 1, watchedAt: -1 });

module.exports = mongoose.model('WatchHistory', WatchHistorySchema);
