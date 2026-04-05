const mongoose = require('mongoose');

const SeriesSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String },
    imageTitle: { type: String },
    imageSmall: { type: String },
    trailer: { type: String },
    year: { type: String },
    limit: { type: Number, default: 13 },
    genre: { type: String },
    duration: { type: String },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    releaseDate: { type: Date },
  },
  { timestamps: true }
);

SeriesSchema.index({ title: 'text', genre: 'text' });

module.exports = mongoose.model('Series', SeriesSchema);
