const router = require('express').Router();
const mongoose = require('mongoose');
const List = require('../models/List');
const Movie = require('../models/Movie');
const Profile = require('../models/Profile');
const WatchHistory = require('../models/WatchHistory');
const verify = require('../verifyToken');
const {
  buildProfileContentFilter,
  isKidBlockedGenre,
} = require('../utils/contentPolicy');

async function buildRecommendedItems(profile, profileFilter, type) {
  if (!profile) return null;
  const typeMatch =
    type === 'series'
      ? { isSeries: true }
      : type === 'movie'
        ? { isSeries: false }
        : {};

  const last = await WatchHistory.findOne({
    profileId: profile._id,
    contentType: 'movie',
  })
    .sort({ watchedAt: -1 })
    .lean();

  const excludeIds = [];
  let genre = null;
  if (last?.contentId) {
    excludeIds.push(last.contentId);
    const m = await Movie.findById(last.contentId).select('genre').lean();
    if (m?.genre) genre = String(m.genre).trim();
  }

  const baseFind = { ...typeMatch, ...profileFilter };
  let items = [];

  if (genre) {
    const q = { ...baseFind, genre };
    if (excludeIds.length) q._id = { $nin: excludeIds };
    items = await Movie.find(q).limit(24).lean();
  }

  const picked = new Set(items.map((x) => String(x._id)));
  excludeIds.forEach((id) => picked.add(String(id)));

  if (items.length < 12) {
    const need = Math.min(24 - items.length, 36);
    const nin = [...picked].map((x) => new mongoose.Types.ObjectId(x));
    const more = await Movie.aggregate([
      { $match: { _id: { $nin: nin }, ...typeMatch, ...profileFilter } },
      { $sample: { size: need } },
    ]);
    items = items.concat(more);
  }

  return items.length ? items.slice(0, 24) : null;
}

router.get('/', verify, async (req, res) => {
  const { profileId, type, genre } = req.query;

  try {
    let profile = null;
    if (profileId) {
      profile = await Profile.findById(profileId);
      if (!profile || String(profile.userId) !== req.user.id) {
        return res.status(403).json('Not authorized for this profile');
      }
    }

    const match = {};
    if (type) match.type = type;
    if (genre) match.genre = genre;
    if (profile && profile.isKid && genre && isKidBlockedGenre(genre)) {
      return res.status(200).json({ hero: null, rails: [] });
    }

    const railsRaw = await List.aggregate([
      { $match: match },
      { $sample: { size: 8 } },
    ]);

    const profileFilter = buildProfileContentFilter(profile);

    let rails = await Promise.all(
      railsRaw.map(async (rail) => {
        if (profile && profile.isKid && isKidBlockedGenre(rail.genre)) {
          return null;
        }
        const ids = Array.isArray(rail.content) ? rail.content : [];
        const items = ids.length ? await Movie.find({ _id: { $in: ids }, ...profileFilter }) : [];
        return {
          _id: rail._id,
          slug: rail.title,
          title: rail.title,
          type: rail.type,
          genre: rail.genre,
          items,
        };
      })
    ).then((rows) => rows.filter(Boolean));

    const heroMatch =
      type === 'series' ? { isSeries: true } : type === 'movie' ? { isSeries: false } : {};
    const hero = await Movie.aggregate([
      { $match: { ...heroMatch, ...profileFilter } },
      { $sample: { size: 1 } },
    ]);

    const recentMatch = { ...profileFilter, ...heroMatch };
    const recentItems = await Movie.find(recentMatch)
      .sort({ createdAt: -1 })
      .limit(24)
      .lean();
    if (recentItems.length) {
      rails = [
        {
          _id: 'rail-recent',
          slug: 'recent',
          title: 'Mới thêm gần đây',
          type: 'movie',
          genre: null,
          items: recentItems,
        },
        ...rails,
      ];
    }

    if (profile) {
      const recItems = await buildRecommendedItems(profile, profileFilter, type);
      if (recItems?.length) {
        let replaced = false;
        rails = rails.map((r) => {
          if (r.title === 'Recommended For You') {
            replaced = true;
            return { ...r, items: recItems };
          }
          return r;
        });
        if (!replaced) {
          rails.push({
            _id: 'rail-recommended',
            slug: 'recommended',
            title: 'Recommended For You',
            type: 'movie',
            genre: null,
            items: recItems,
          });
        }
      }
    }

    res.status(200).json({
      hero: hero[0] || null,
      rails,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
