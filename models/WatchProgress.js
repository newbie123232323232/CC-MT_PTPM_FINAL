const mongoose = require('mongoose');

const WatchProgressSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    contentType: { type: String, enum: ['movie', 'episode'], default: 'movie' },
    seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
    seasonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Season' },
    positionSec: { type: Number, default: 0 },
    durationSec: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    lastWatchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

WatchProgressSchema.index({ profileId: 1, contentId: 1 }, { unique: true });
WatchProgressSchema.index({ profileId: 1, lastWatchedAt: -1 });

module.exports = mongoose.model('WatchProgress', WatchProgressSchema);
