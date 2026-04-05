const mongoose = require('mongoose');

const DownloadItemSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    episodeId: { type: mongoose.Schema.Types.ObjectId },
    status: {
      type: String,
      enum: ['queued', 'downloading', 'paused', 'done', 'failed'],
      default: 'queued',
    },
    progress: { type: Number, default: 0 },
    quality: { type: String, enum: ['sd', 'hd', 'fhd'], default: 'hd' },
    localRef: { type: String },
    retryCount: { type: Number, default: 0 },
    lastError: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

DownloadItemSchema.index({ profileId: 1, updatedAt: -1 });

module.exports = mongoose.model('DownloadItem', DownloadItemSchema);
