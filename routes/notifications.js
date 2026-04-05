const router = require('express').Router();
const verify = require('../verifyToken');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const { assertProfileOwner } = require('../utils/profileOwnership');
const { subscribeNotification } = require('../services/realtime');
const { generateTrendingNotifications } = require('../services/notificationService');

function sendError(res, status, code, message, details) {
  return res.status(status).json({ code, message, details });
}

router.get('/', verify, async (req, res) => {
  const { profileId, page = 1, limit = 20 } = req.query;
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    const isOwner = profileId
      ? await assertProfileOwner(Profile, profileId, req.user.id)
      : true;
    if (!isOwner) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'Not authorized for this profile'
      );
    }

    const query = { userId: req.user.id };
    if (profileId) query.profileId = profileId;

    const [items, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
      Notification.countDocuments(query),
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
    sendError(
      res,
      500,
      'NOTIFICATION_LIST_FAILED',
      'Failed to fetch notifications',
      err
    );
  }
});

router.post('/:id/read', verify, async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { read: true } },
      { new: true }
    );

    if (!updated) {
      return sendError(
        res,
        404,
        'NOTIFICATION_NOT_FOUND',
        'Notification not found'
      );
    }

    res.status(200).json(updated);
  } catch (err) {
    sendError(
      res,
      500,
      'NOTIFICATION_READ_FAILED',
      'Failed to mark notification as read',
      err
    );
  }
});

router.post('/read-all', verify, async (req, res) => {
  const { profileId } = req.body;
  try {
    const isOwner = profileId
      ? await assertProfileOwner(Profile, profileId, req.user.id)
      : true;
    if (!isOwner) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'Not authorized for this profile'
      );
    }

    const query = { userId: req.user.id };
    if (profileId) query.profileId = profileId;

    await Notification.updateMany(query, { $set: { read: true } });
    res.status(200).json({ success: true });
  } catch (err) {
    sendError(
      res,
      500,
      'NOTIFICATION_READ_ALL_FAILED',
      'Failed to mark all notifications as read',
      err
    );
  }
});

router.post('/jobs/trending', verify, async (req, res) => {
  if (!req.user.isAdmin) {
    return sendError(res, 403, 'FORBIDDEN', 'Not authorized to run trending job');
  }
  const { days = 7, limit = 5 } = req.body || {};
  try {
    const result = await generateTrendingNotifications({ days, limit });
    res.status(200).json(result);
  } catch (err) {
    sendError(
      res,
      500,
      'NOTIFICATION_TRENDING_JOB_FAILED',
      'Failed to generate trending notifications',
      err
    );
  }
});

router.get('/stream', verify, async (req, res) => {
  const { profileId } = req.query;
  try {
    const isOwner = profileId
      ? await assertProfileOwner(Profile, profileId, req.user.id)
      : true;
    if (!isOwner) {
      return sendError(res, 403, 'FORBIDDEN', 'Not authorized for this profile');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const heartbeat = setInterval(() => {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    }, 25000);

    const unsubscribe = subscribeNotification((payload) => {
      const sameUser = String(payload.userId) === String(req.user.id);
      const sameProfile = !profileId || String(payload.profileId) === String(profileId);
      if (sameUser && sameProfile) {
        res.write(`event: notification\ndata: ${JSON.stringify(payload)}\n\n`);
      }
    });

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });
  } catch (err) {
    sendError(res, 500, 'NOTIFICATION_STREAM_FAILED', 'Failed to open notification stream', err);
  }
});

module.exports = router;
