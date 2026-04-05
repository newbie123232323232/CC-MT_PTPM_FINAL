const mongoose = require('mongoose');

const ContentReviewSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

ContentReviewSchema.index(
  { profileId: 1, contentId: 1 },
  { unique: true }
);
ContentReviewSchema.index({ contentId: 1, createdAt: -1 });

module.exports = mongoose.model('ContentReview', ContentReviewSchema);
