const mongoose = require('mongoose');

const SeasonSchema = new mongoose.Schema(
  {
    seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: true },
    seasonNumber: { type: Number, required: true },
    title: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

SeasonSchema.index({ seriesId: 1, seasonNumber: 1 }, { unique: true });

module.exports = mongoose.model('Season', SeasonSchema);
