const router = require('express').Router();
const Movie = require('../models/Movie');
const Series = require('../models/Series');
const Profile = require('../models/Profile');
const verify = require('../verifyToken');
const {
  buildProfileContentFilter,
  isContentAllowedForProfile,
  isKidBlockedGenre,
} = require('../utils/contentPolicy');

router.get('/search', verify, async (req, res) => {
  const {
    q = '',
    type,
    genre,
    profileId,
    page = 1,
    limit = 20,
  } = req.query;

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    let profile = null;
    let profileFilter = {};
    if (profileId) {
      profile = await Profile.findById(profileId);
      if (!profile || String(profile.userId) !== req.user.id) {
        return res.status(403).json('Not authorized for this profile');
      }
      profileFilter = buildProfileContentFilter(profile);
      if (profile.isKid && genre && isKidBlockedGenre(genre)) {
        return res.status(200).json({
          items: [],
          pagination: { page: pageNumber, limit: limitNumber, total: 0, totalPages: 0 },
        });
      }
    }

    const filter = {};
    if (q.trim()) {
      filter.title = { $regex: q.trim(), $options: 'i' };
    }
    if (genre) {
      filter.genre = genre;
    }
    if (type === 'series') {
      filter.isSeries = true;
    } else if (type === 'movie') {
      filter.isSeries = false;
    }
    Object.assign(filter, profileFilter);

    const [items, total] = await Promise.all([
      Movie.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
      Movie.countDocuments(filter),
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

router.get('/content/:id', verify, async (req, res) => {
  try {
    const { profileId } = req.query;
    let profile = null;
    if (profileId) {
      profile = await Profile.findById(profileId);
      if (!profile || String(profile.userId) !== req.user.id) {
        return res.status(403).json('Not authorized for this profile');
      }
    }

    const item = await Movie.findById(req.params.id);
    if (!item) {
      return res.status(404).json('Content not found');
    }
    if (profile && !isContentAllowedForProfile(profile, item)) {
      return res.status(403).json('Content blocked by maturity settings');
    }
    res.status(200).json(item);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/content/:id/similar', verify, async (req, res) => {
  try {
    const { profileId } = req.query;
    let profile = null;
    if (profileId) {
      profile = await Profile.findById(profileId);
      if (!profile || String(profile.userId) !== req.user.id) {
        return res.status(403).json('Not authorized for this profile');
      }
    }

    const base = await Movie.findById(req.params.id);
    if (!base) {
      return res.status(404).json('Content not found');
    }
    if (profile && !isContentAllowedForProfile(profile, base)) {
      return res.status(403).json('Content blocked by maturity settings');
    }

    const similar = await Movie.find({
      _id: { $ne: base._id },
      isSeries: base.isSeries,
      genre: base.genre,
      ...(profile ? buildProfileContentFilter(profile) : {}),
    })
      .limit(20)
      .sort({ createdAt: -1 });

    res.status(200).json(similar);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/new-hot', verify, async (req, res) => {
  const { profileId, page = 1, limit = 20 } = req.query;
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

    const profileFilter = profile ? buildProfileContentFilter(profile) : {};

    const [movies, series] = await Promise.all([
      Movie.find(profileFilter).sort({ createdAt: -1 }).limit(200),
      Series.find({ status: 'published', ...profileFilter }).sort({ createdAt: -1 }).limit(200),
    ]);

    const merged = [
      ...movies.map((x) => ({ ...x.toObject(), contentType: 'movie' })),
      ...series.map((x) => ({ ...x.toObject(), contentType: 'series' })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const sliced = merged.slice(skip, skip + limitNumber);
    res.status(200).json({
      items: sliced,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: merged.length,
        totalPages: Math.ceil(merged.length / limitNumber),
      },
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
