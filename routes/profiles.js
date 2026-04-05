const router = require('express').Router();
const Profile = require('../models/Profile');
const verify = require('../verifyToken');

// Get current user's profiles
router.get('/', verify, async (req, res) => {
  try {
    const profiles = await Profile.find({ userId: req.user.id }).sort({
      isDefault: -1,
      createdAt: 1,
    });
    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Create profile for current user
router.post('/', verify, async (req, res) => {
  try {
    const count = await Profile.countDocuments({ userId: req.user.id });
    if (count >= 5) {
      return res.status(400).json('Maximum 5 profiles per account');
    }

    const isFirstProfile = count === 0;
    const profile = new Profile({
      userId: req.user.id,
      name: req.body.name,
      avatarUrl: req.body.avatarUrl,
      isKid: req.body.isKid,
      maturityLevel: req.body.maturityLevel,
      language: req.body.language,
      isDefault: isFirstProfile || Boolean(req.body.isDefault),
    });

    if (profile.isDefault) {
      await Profile.updateMany(
        { userId: req.user.id, _id: { $ne: profile._id } },
        { $set: { isDefault: false } }
      );
    }

    const saved = await profile.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Update profile
router.put('/:id', verify, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json('Profile not found');
    }
    if (String(profile.userId) !== req.user.id) {
      return res.status(403).json('Not authorized to update profile');
    }

    if (req.body.isDefault === true) {
      await Profile.updateMany(
        { userId: req.user.id, _id: { $ne: profile._id } },
        { $set: { isDefault: false } }
      );
    }

    const updated = await Profile.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Delete profile
router.delete('/:id', verify, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json('Profile not found');
    }
    if (String(profile.userId) !== req.user.id) {
      return res.status(403).json('Not authorized to delete profile');
    }

    await Profile.findByIdAndDelete(req.params.id);

    const hasDefault = await Profile.exists({
      userId: req.user.id,
      isDefault: true,
    });
    if (!hasDefault) {
      const firstRemaining = await Profile.findOne({ userId: req.user.id }).sort({
        createdAt: 1,
      });
      if (firstRemaining) {
        await Profile.findByIdAndUpdate(firstRemaining._id, { $set: { isDefault: true } });
      }
    }

    res.status(200).json('Profile deleted successfully');
  } catch (err) {
    res.status(500).json(err);
  }
});

// Select active default profile
router.post('/:id/select', verify, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json('Profile not found');
    }
    if (String(profile.userId) !== req.user.id) {
      return res.status(403).json('Not authorized to select profile');
    }

    await Profile.updateMany({ userId: req.user.id }, { $set: { isDefault: false } });
    const selected = await Profile.findByIdAndUpdate(
      req.params.id,
      { $set: { isDefault: true } },
      { new: true }
    );

    res.status(200).json(selected);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
