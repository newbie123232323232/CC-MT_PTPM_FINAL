const router = require('express').Router();
const verify = require('../verifyToken');
const Series = require('../models/Series');
const Season = require('../models/Season');
const Episode = require('../models/Episode');
const Profile = require('../models/Profile');
const { buildProfileContentFilter, isContentAllowedForProfile } = require('../utils/contentPolicy');

router.post('/', verify, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json('Not authorized to create series');
  try {
    const saved = await new Series(req.body).save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/:id', verify, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json('Not authorized to update series');
  try {
    const updated = await Series.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete('/:id', verify, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json('Not authorized to delete series');
  try {
    await Promise.all([
      Series.findByIdAndDelete(req.params.id),
      Season.deleteMany({ seriesId: req.params.id }),
      Episode.deleteMany({ seriesId: req.params.id }),
    ]);
    res.status(200).json('Series deleted successfully');
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/', verify, async (req, res) => {
  const { page = 1, limit = 20, profileId, genre } = req.query;
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const skip = (pageNumber - 1) * limitNumber;
  try {
    let profile = null;
    if (profileId) {
      profile = await Profile.findById(profileId);
      if (!profile || String(profile.userId) !== req.user.id) {
        return res.status(403).json('Not authorized for this profile');
      }
    }

    const filter = req.user.isAdmin && !profileId ? {} : { status: 'published' };
    if (genre) filter.genre = genre;
    Object.assign(filter, buildProfileContentFilter(profile));

    const [items, total] = await Promise.all([
      Series.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
      Series.countDocuments(filter),
    ]);

    res.status(200).json({
      items,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/:id', verify, async (req, res) => {
  try {
    const { profileId } = req.query;
    let profile = null;
    if (profileId) {
      profile = await Profile.findById(profileId);
      if (!profile || String(profile.userId) !== req.user.id) {
        return res.status(403).json('Not authorized for this profile');
      }
    }

    const item = await Series.findById(req.params.id);
    if (!item) return res.status(404).json('Series not found');
    if (item.status !== 'published' && !req.user.isAdmin) {
      return res.status(403).json('Series is not published');
    }
    if (profile && !isContentAllowedForProfile(profile, item)) {
      return res.status(403).json('Content blocked by maturity settings');
    }

    const seasons = await Season.find({ seriesId: item._id }).sort({ seasonNumber: 1 });
    res.status(200).json({ ...item.toObject(), seasons });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
