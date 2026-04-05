const router = require('express').Router();
const verify = require('../verifyToken');
const Profile = require('../models/Profile');
const Movie = require('../models/Movie');
const Episode = require('../models/Episode');
const Season = require('../models/Season');
const WatchProgress = require('../models/WatchProgress');
const WatchHistory = require('../models/WatchHistory');
const ViewEvent = require('../models/ViewEvent');
const { assertProfileOwner } = require('../utils/profileOwnership');

function sendError(res, status, code, message, details) {
  return res.status(status).json({ code, message, details });
}

function buildPercent(positionSec, durationSec) {
  if (!durationSec || durationSec <= 0) return 0;
  const raw = Math.round((positionSec / durationSec) * 100);
  return Math.max(0, Math.min(raw, 100));
}

async function getContentByType(contentType, contentId) {
  if (contentType === 'episode') {
    return Episode.findById(contentId);
  }
  return Movie.findById(contentId);
}

router.post('/start', verify, async (req, res) => {
  const { profileId, contentId, contentType = 'movie' } = req.body;
  if (!profileId || !contentId) {
    return sendError(
      res,
      400,
      'BAD_REQUEST',
      'profileId and contentId are required'
    );
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

    const content = await getContentByType(contentType, contentId);
    if (!content) {
      return sendError(res, 404, 'CONTENT_NOT_FOUND', 'Content not found');
    }

    const progress = await WatchProgress.findOneAndUpdate(
      { profileId, contentId },
      {
        $setOnInsert: {
          profileId,
          contentId,
          contentType,
          seriesId: contentType === 'episode' ? content.seriesId : undefined,
          seasonId: contentType === 'episode' ? content.seasonId : undefined,
          positionSec: 0,
          durationSec: 0,
          percent: 0,
          completed: false,
          lastWatchedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    if (contentType === 'movie') {
      ViewEvent.create({
        contentId,
        profileId,
        userId: req.user.id,
        at: new Date(),
      }).catch(() => {});
    }

    res.status(200).json(progress);
  } catch (err) {
    sendError(res, 500, 'PLAYBACK_START_FAILED', 'Failed to start playback', err);
  }
});

router.post('/progress', verify, async (req, res) => {
  const { profileId, contentId, contentType = 'movie', positionSec = 0, durationSec = 0 } = req.body;
  if (!profileId || !contentId) {
    return sendError(
      res,
      400,
      'BAD_REQUEST',
      'profileId and contentId are required'
    );
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

    const content = await getContentByType(contentType, contentId);
    if (!content) {
      return sendError(res, 404, 'CONTENT_NOT_FOUND', 'Content not found');
    }

    const safePosition = Math.max(0, Number(positionSec) || 0);
    const safeDuration = Math.max(0, Number(durationSec) || 0);
    const percent = buildPercent(safePosition, safeDuration);
    const completed = percent >= 95;

    const progress = await WatchProgress.findOneAndUpdate(
      { profileId, contentId },
      {
        $set: {
          positionSec: safePosition,
          durationSec: safeDuration,
          percent,
          completed,
          lastWatchedAt: new Date(),
        },
        $setOnInsert: {
          profileId,
          contentId,
          contentType,
          seriesId: contentType === 'episode' ? content.seriesId : undefined,
          seasonId: contentType === 'episode' ? content.seasonId : undefined,
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json(progress);
  } catch (err) {
    sendError(
      res,
      500,
      'PLAYBACK_PROGRESS_FAILED',
      'Failed to update playback progress',
      err
    );
  }
});

router.post('/complete', verify, async (req, res) => {
  const { profileId, contentId, contentType = 'movie' } = req.body;
  if (!profileId || !contentId) {
    return sendError(
      res,
      400,
      'BAD_REQUEST',
      'profileId and contentId are required'
    );
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

    const progress = await WatchProgress.findOneAndUpdate(
      { profileId, contentId },
      {
        $set: {
          completed: true,
          percent: 100,
          lastWatchedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!progress) {
      return sendError(
        res,
        404,
        'PROGRESS_NOT_FOUND',
        'No playback progress found for this content'
      );
    }

    await WatchHistory.create({
      profileId,
      contentId,
      contentType,
      seriesId: progress.seriesId,
      seasonId: progress.seasonId,
      watchedAt: new Date(),
      positionSec: progress.positionSec,
      durationSec: progress.durationSec,
    });

    res.status(200).json(progress);
  } catch (err) {
    sendError(
      res,
      500,
      'PLAYBACK_COMPLETE_FAILED',
      'Failed to complete playback',
      err
    );
  }
});

router.get('/next-episode', verify, async (req, res) => {
  const { profileId, currentEpisodeId } = req.query;
  if (!profileId || !currentEpisodeId) {
    return sendError(
      res,
      400,
      'BAD_REQUEST',
      'profileId and currentEpisodeId are required'
    );
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

    const current = await Episode.findById(currentEpisodeId);
    if (!current) {
      return sendError(res, 404, 'EPISODE_NOT_FOUND', 'Current episode not found');
    }

    let next = await Episode.findOne({
      seasonId: current.seasonId,
      episodeNumber: { $gt: current.episodeNumber },
    }).sort({ episodeNumber: 1 });

    if (!next) {
      const currentSeason = await Season.findById(current.seasonId);
      if (!currentSeason) {
        return res.status(200).json({ nextEpisode: null });
      }
      const nextSeason = await Season.findOne({
        seriesId: current.seriesId,
        seasonNumber: { $gt: currentSeason.seasonNumber },
      }).sort({ seasonNumber: 1 });
      if (!nextSeason) {
        return res.status(200).json({ nextEpisode: null });
      }
      next = await Episode.findOne({ seasonId: nextSeason._id }).sort({
        episodeNumber: 1,
      });
    }

    res.status(200).json({ nextEpisode: next || null });
  } catch (err) {
    sendError(
      res,
      500,
      'PLAYBACK_NEXT_EPISODE_FAILED',
      'Failed to get next episode',
      err
    );
  }
});

module.exports = router;
