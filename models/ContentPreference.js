const mongoose = require('mongoose');

const ContentPreferenceSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    audioLanguage: { type: String, default: 'vi' },
    subtitleLanguage: { type: String, default: 'vi' },
    subtitleEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ContentPreferenceSchema.index({ profileId: 1, contentId: 1 }, { unique: true });

module.exports = mongoose.model('ContentPreference', ContentPreferenceSchema);
