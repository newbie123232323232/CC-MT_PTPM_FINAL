const mongoose = require('mongoose');

const MyListItemSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MyListItemSchema.index({ profileId: 1, contentId: 1 }, { unique: true });

module.exports = mongoose.model('MyListItem', MyListItemSchema);
