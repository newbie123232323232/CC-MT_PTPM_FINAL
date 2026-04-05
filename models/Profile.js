const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    isKid: { type: Boolean, default: false },
    maturityLevel: { type: Number, default: 16 },
    language: { type: String, default: 'vi' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProfileSchema.index({ userId: 1 });

module.exports = mongoose.model('Profile', ProfileSchema);
