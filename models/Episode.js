const mongoose = require('mongoose');

const EpisodeSchema = new mongoose.Schema(
  {
    seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: true },
    seasonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
    episodeNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    duration: { type: String },
    video: { type: String },
    trailer: { type: String },
    imageSmall: { type: String },
  },
  { timestamps: true }
);

EpisodeSchema.index({ seasonId: 1, episodeNumber: 1 }, { unique: true });

module.exports = mongoose.model('Episode', EpisodeSchema);
