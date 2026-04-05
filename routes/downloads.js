const router = require('express').Router();
const verify = require('../verifyToken');
const Profile = require('../models/Profile');
const Movie = require('../models/Movie');
const DownloadItem = require('../models/DownloadItem');
const UserSetting = require('../models/UserSetting');
const { assertProfileOwner } = require('../utils/profileOwnership');
const { canTransition, isQualityAllowed } = require('../utils/downloadPolicy');

function sendError(res, status, code, message, details) {
  return res.status(status).json({ code, message, details });
}

router.get('/', verify, async (req, res) => {
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

    const items = await DownloadItem.find({ profileId }).sort({ updatedAt: -1 });
    res.status(200).json(items);
  } catch (err) {
    sendError(
      res,
      500,
      'DOWNLOAD_LIST_FAILED',
      'Failed to fetch downloads',
      err
    );
  }
});

router.post('/', verify, async (req, res) => {
  const { profileId, contentId, episodeId, quality } = req.body;
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

    const exists = await Movie.exists({ _id: contentId });
    if (!exists) {
      return sendError(res, 404, 'CONTENT_NOT_FOUND', 'Content not found');
    }

    const setting = await UserSetting.findOne({
      userId: req.user.id,
      profileId: profileId || null,
    });
    const requestedQuality = quality || 'hd';
    const maxQuality = setting?.downloadQuality || 'hd';
    if (!isQualityAllowed(requestedQuality, maxQuality)) {
      return sendError(
        res,
        400,
        'QUALITY_NOT_ALLOWED',
        `Requested quality (${requestedQuality}) exceeds setting (${maxQuality})`
      );
    }

    const created = await DownloadItem.create({
      profileId,
      contentId,
      episodeId,
      quality: requestedQuality,
      status: 'queued',
      progress: 0,
    });

    res.status(201).json(created);
  } catch (err) {
    sendError(
      res,
      500,
      'DOWNLOAD_CREATE_FAILED',
      'Failed to create download item',
      err
    );
  }
});

router.put('/:id', verify, async (req, res) => {
  const { id } = req.params;
  const { status, progress, localRef, networkType, errorMessage } = req.body;

  try {
    const item = await DownloadItem.findById(id);
    if (!item) {
      return sendError(
        res,
        404,
        'DOWNLOAD_NOT_FOUND',
        'Download item not found'
      );
    }

    const isOwner = await assertProfileOwner(Profile, item.profileId, req.user.id);
    if (!isOwner) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'Not authorized for this download item'
      );
    }

    const data = {};
    if (typeof status !== 'undefined') {
      if (!canTransition(item.status, status)) {
        return sendError(
          res,
          400,
          'INVALID_STATUS_TRANSITION',
          `Cannot transition download from ${item.status} to ${status}`
        );
      }

      const setting = await UserSetting.findOne({
        userId: req.user.id,
        profileId: item.profileId || null,
      });
      if (
        status === 'downloading' &&
        setting?.downloadWifiOnly === true &&
        networkType !== 'wifi'
      ) {
        return sendError(
          res,
          400,
          'WIFI_REQUIRED',
          'Download is restricted to Wi-Fi only'
        );
      }

      data.status = status;
      if (status === 'done') {
        if (!localRef) {
          return sendError(
            res,
            400,
            'LOCAL_REF_REQUIRED',
            'localRef is required when status is done'
          );
        }
        data.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      if (status === 'failed') {
        data.lastError = errorMessage || 'Download failed';
        data.retryCount = (item.retryCount || 0) + 1;
      }
      if (item.status === 'failed' && status === 'queued') {
        data.lastError = null;
      }
    }
    if (typeof progress !== 'undefined')
      data.progress = Math.max(0, Math.min(100, Number(progress) || 0));
    if (typeof localRef !== 'undefined') data.localRef = localRef;

    const updated = await DownloadItem.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    sendError(
      res,
      500,
      'DOWNLOAD_UPDATE_FAILED',
      'Failed to update download item',
      err
    );
  }
});

router.delete('/:id', verify, async (req, res) => {
  const { id } = req.params;
  try {
    const item = await DownloadItem.findById(id);
    if (!item) {
      return sendError(
        res,
        404,
        'DOWNLOAD_NOT_FOUND',
        'Download item not found'
      );
    }

    const isOwner = await assertProfileOwner(Profile, item.profileId, req.user.id);
    if (!isOwner) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'Not authorized for this download item'
      );
    }

    await DownloadItem.findByIdAndDelete(id);
    res.status(200).json({ success: true });
  } catch (err) {
    sendError(
      res,
      500,
      'DOWNLOAD_DELETE_FAILED',
      'Failed to delete download item',
      err
    );
  }
});

module.exports = router;
