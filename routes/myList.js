const router = require('express').Router();
const MyListItem = require('../models/MyListItem');
const Profile = require('../models/Profile');
const Movie = require('../models/Movie');
const verify = require('../verifyToken');
const { assertProfileOwner } = require('../utils/profileOwnership');

router.get('/', verify, async (req, res) => {
  const { profileId } = req.query;
  if (!profileId) {
    return res.status(400).json('profileId is required');
  }

  try {
    const isOwner = await assertProfileOwner(Profile, profileId, req.user.id);
    if (!isOwner) {
      return res.status(403).json('Not authorized for this profile');
    }

    const entries = await MyListItem.find({ profileId }).sort({ addedAt: -1 });
    const ids = entries.map((x) => x.contentId);
    const movies = ids.length ? await Movie.find({ _id: { $in: ids } }) : [];
    res.status(200).json(movies);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/', verify, async (req, res) => {
  const { profileId, contentId } = req.body;
  if (!profileId || !contentId) {
    return res.status(400).json('profileId and contentId are required');
  }

  try {
    const isOwner = await assertProfileOwner(Profile, profileId, req.user.id);
    if (!isOwner) {
      return res.status(403).json('Not authorized for this profile');
    }

    const exists = await Movie.exists({ _id: contentId });
    if (!exists) {
      return res.status(404).json('Content not found');
    }

    const created = await MyListItem.findOneAndUpdate(
      { profileId, contentId },
      { $setOnInsert: { profileId, contentId, addedAt: new Date() } },
      { new: true, upsert: true }
    );

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete('/:contentId', verify, async (req, res) => {
  const { profileId } = req.query;
  const { contentId } = req.params;
  if (!profileId) {
    return res.status(400).json('profileId is required');
  }

  try {
    const isOwner = await assertProfileOwner(Profile, profileId, req.user.id);
    if (!isOwner) {
      return res.status(403).json('Not authorized for this profile');
    }

    await MyListItem.deleteOne({ profileId, contentId });
    res.status(200).json('Removed from my list');
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
