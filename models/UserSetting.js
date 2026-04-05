const mongoose = require('mongoose');

const UserSettingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    autoplayNext: { type: Boolean, default: true },
    autoplayPreview: { type: Boolean, default: true },
    displayLanguage: { type: String, default: 'vi' },
    subtitleLanguage: { type: String, default: 'vi' },
    maturityGateEnabled: { type: Boolean, default: false },
    notificationEnabled: { type: Boolean, default: true },
    notifyNewRelease: { type: Boolean, default: true },
    notifyNewEpisode: { type: Boolean, default: true },
    notifyTrending: { type: Boolean, default: false },
    downloadWifiOnly: { type: Boolean, default: true },
    downloadQuality: { type: String, enum: ['sd', 'hd', 'fhd'], default: 'hd' },
  },
  { timestamps: true }
);

UserSettingSchema.index({ userId: 1, profileId: 1 }, { unique: true });

module.exports = mongoose.model('UserSetting', UserSettingSchema);
