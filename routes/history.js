const router = require('express').Router();
const verify = require('../verifyToken');
const Profile = require('../models/Profile');
const Movie = require('../models/Movie');
const WatchProgress = require('../models/WatchProgress');
const WatchHistory = require('../models/WatchHistory');
const { assertProfileOwner } = require('../utils/profileOwnership');

function sendError(res, status, code, message, details) {
  return res.status(status).json({ code, message, details });
}

router.get('/continue', verify, async (req, res) => {
  const { profileId } = req.query;
  if (!profileId) {
    return sendError(res, 400, 'BAD_REQUEST', 'profileId is required');
  }

  try {
    const isOwner = await assertProfileOwner(Profile, profileId, req.user.id);
    if (!isOwner) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'Not authorized for this profile'
      );
    }

    const progressList = await WatchProgress.find({
      profileId,
      completed: false,
      percent: { $gt: 0, $lt: 95 },
    })
      .sort({ lastWatchedAt: -1 })
      .limit(20);

    const ids = progressList.map((x) => x.contentId);
    const items = ids.length ? await Movie.find({ _id: { $in: ids } }) : [];
    const map = new Map(items.map((x) => [String(x._id), x]));

    const result = progressList
      .map((entry) => ({
        ...entry.toObject(),
        content: map.get(String(entry.contentId)) || null,
      }))
      .filter((entry) => Boolean(entry.content));

    res.status(200).json(result);
  } catch (err) {
    sendError(
      res,
      500,
      'HISTORY_CONTINUE_FAILED',
      'Failed to fetch continue watching list',
      err
    );
  }
});

router.get('/recent', verify, async (req, res) => {
  const { profileId, page = 1, limit = 20 } = req.query;
  if (!profileId) {
    return sendError(res, 400, 'BAD_REQUEST', 'profileId is required');
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    const isOwner = await assertProfileOwner(Profile, profileId, req.user.id);
    if (!isOwner) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'Not authorized for this profile'
      );
    }

    const [rows, total] = await Promise.all([
      WatchHistory.find({ profileId }).sort({ watchedAt: -1 }).skip(skip).limit(limitNumber),
      WatchHistory.countDocuments({ profileId }),
    ]);

    const ids = rows.map((x) => x.contentId);
    const items = ids.length ? await Movie.find({ _id: { $in: ids } }) : [];
    const map = new Map(items.map((x) => [String(x._id), x]));

    const entries = rows
      .map((entry) => ({
        ...entry.toObject(),
        content: map.get(String(entry.contentId)) || null,
      }))
      .filter((entry) => Boolean(entry.content));

    res.status(200).json({
      items: entries,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (err) {
    sendError(
      res,
      500,
      'HISTORY_RECENT_FAILED',
      'Failed to fetch recent history',
      err
    );
  }
});

module.exports = router;
