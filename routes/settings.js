const router = require('express').Router();
const verify = require('../verifyToken');
const CryptoJS = require('crypto-js');
const User = require('../models/User');
const Profile = require('../models/Profile');
const UserSetting = require('../models/UserSetting');
const MyListItem = require('../models/MyListItem');
const WatchProgress = require('../models/WatchProgress');
const WatchHistory = require('../models/WatchHistory');
const Notification = require('../models/Notification');
const DownloadItem = require('../models/DownloadItem');
const Movie = require('../models/Movie');
const ContentPreference = require('../models/ContentPreference');
const { assertProfileOwner } = require('../utils/profileOwnership');

function sendError(res, status, code, message, details) {
  return res.status(status).json({ code, message, details });
}

function getDefaultSetting(userId, profileId) {
  return {
    userId,
    profileId: profileId || null,
    autoplayNext: true,
    autoplayPreview: true,
    displayLanguage: 'vi',
    subtitleLanguage: 'vi',
    maturityGateEnabled: false,
    notificationEnabled: true,
    notifyNewRelease: true,
    notifyNewEpisode: true,
    notifyTrending: false,
    downloadWifiOnly: true,
    downloadQuality: 'hd',
  };
}

router.get('/', verify, async (req, res) => {
  const { profileId } = req.query;

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

    const setting = await UserSetting.findOne({
      userId: req.user.id,
      profileId: profileId || null,
    });

    if (!setting) {
      return res.status(200).json(getDefaultSetting(req.user.id, profileId));
    }

    res.status(200).json(setting);
  } catch (err) {
    sendError(
      res,
      500,
      'SETTINGS_FETCH_FAILED',
      'Failed to fetch settings',
      err
    );
  }
});

router.get('/sections', verify, async (req, res) => {
  const { profileId } = req.query;
  try {
    const isOwner = profileId
      ? await assertProfileOwner(Profile, profileId, req.user.id)
      : true;
    if (!isOwner) {
      return sendError(res, 403, 'FORBIDDEN', 'Not authorized for this profile');
    }

    const row =
      (await UserSetting.findOne({ userId: req.user.id, profileId: profileId || null })) ||
      getDefaultSetting(req.user.id, profileId);

    res.status(200).json({
      notifications: {
        notificationEnabled: row.notificationEnabled,
        notifyNewRelease: row.notifyNewRelease,
        notifyNewEpisode: row.notifyNewEpisode,
        notifyTrending: row.notifyTrending,
      },
      playback: {
        autoplayNext: row.autoplayNext,
        autoplayPreview: row.autoplayPreview,
      },
      language: {
        displayLanguage: row.displayLanguage,
        subtitleLanguage: row.subtitleLanguage,
      },
      download: {
        downloadWifiOnly: row.downloadWifiOnly,
        downloadQuality: row.downloadQuality,
      },
      account: {
        maturityGateEnabled: row.maturityGateEnabled,
      },
    });
  } catch (err) {
    sendError(res, 500, 'SETTINGS_SECTIONS_FAILED', 'Failed to fetch settings sections', err);
  }
});

router.put('/', verify, async (req, res) => {
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

    const allowFields = [
      'autoplayNext',
      'autoplayPreview',
      'displayLanguage',
      'subtitleLanguage',
      'maturityGateEnabled',
    ];

    const data = {};
    allowFields.forEach((key) => {
      if (typeof req.body[key] !== 'undefined') {
        data[key] = req.body[key];
      }
    });

    const updated = await UserSetting.findOneAndUpdate(
      { userId: req.user.id, profileId: profileId || null },
      { $set: data, $setOnInsert: { userId: req.user.id, profileId: profileId || null } },
      { upsert: true, new: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    sendError(
      res,
      500,
      'SETTINGS_UPDATE_FAILED',
      'Failed to update settings',
      err
    );
  }
});

async function updateSettingByFields(req, res, allowFields) {
  const { profileId } = req.body;
  const isOwner = profileId
    ? await assertProfileOwner(Profile, profileId, req.user.id)
    : true;
  if (!isOwner) {
    return sendError(res, 403, 'FORBIDDEN', 'Not authorized for this profile');
  }

  const data = {};
  allowFields.forEach((key) => {
    if (typeof req.body[key] !== 'undefined') {
      data[key] = req.body[key];
    }
  });

  const updated = await UserSetting.findOneAndUpdate(
    { userId: req.user.id, profileId: profileId || null },
    { $set: data, $setOnInsert: { userId: req.user.id, profileId: profileId || null } },
    { upsert: true, new: true }
  );
  return res.status(200).json(updated);
}

router.put('/notifications', verify, async (req, res) => {
  try {
    return await updateSettingByFields(
      req,
      res,
      ['notificationEnabled', 'notifyNewRelease', 'notifyNewEpisode', 'notifyTrending']
    );
  } catch (err) {
    sendError(res, 500, 'SETTINGS_NOTIFICATIONS_UPDATE_FAILED', 'Failed to update notification settings', err);
  }
});

router.put('/playback', verify, async (req, res) => {
  try {
    return await updateSettingByFields(
      req,
      res,
      ['autoplayNext', 'autoplayPreview']
    );
  } catch (err) {
    sendError(res, 500, 'SETTINGS_PLAYBACK_UPDATE_FAILED', 'Failed to update playback settings', err);
  }
});

router.put('/language', verify, async (req, res) => {
  try {
    return await updateSettingByFields(
      req,
      res,
      ['displayLanguage', 'subtitleLanguage']
    );
  } catch (err) {
    sendError(res, 500, 'SETTINGS_LANGUAGE_UPDATE_FAILED', 'Failed to update language settings', err);
  }
});

router.put('/download', verify, async (req, res) => {
  try {
    return await updateSettingByFields(
      req,
      res,
      ['downloadWifiOnly', 'downloadQuality']
    );
  } catch (err) {
    sendError(res, 500, 'SETTINGS_DOWNLOAD_UPDATE_FAILED', 'Failed to update download settings', err);
  }
});

router.put('/account/email', verify, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return sendError(res, 400, 'BAD_REQUEST', 'email is required');
  }

  try {
    const exists = await User.exists({ email, _id: { $ne: req.user.id } });
    if (exists) {
      return sendError(res, 409, 'EMAIL_EXISTS', 'Email is already in use');
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { email } },
      { new: true }
    );
    if (!updated) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    const { password, ...info } = updated._doc;
    res.status(200).json(info);
  } catch (err) {
    sendError(res, 500, 'ACCOUNT_EMAIL_UPDATE_FAILED', 'Failed to update email', err);
  }
});

router.put('/account/password', verify, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return sendError(
      res,
      400,
      'BAD_REQUEST',
      'currentPassword and newPassword are required'
    );
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    const bytes = CryptoJS.AES.decrypt(user.password, process.env.SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (decrypted !== currentPassword) {
      return sendError(res, 401, 'INVALID_PASSWORD', 'Current password is incorrect');
    }

    const encryptedNew = CryptoJS.AES.encrypt(
      newPassword,
      process.env.SECRET_KEY
    ).toString();
    await User.findByIdAndUpdate(req.user.id, { $set: { password: encryptedNew } });
    res.status(200).json({ success: true });
  } catch (err) {
    sendError(
      res,
      500,
      'ACCOUNT_PASSWORD_UPDATE_FAILED',
      'Failed to update password',
      err
    );
  }
});

router.delete('/account', verify, async (req, res) => {
  const { currentPassword } = req.body;
  if (!currentPassword) {
    return sendError(res, 400, 'BAD_REQUEST', 'currentPassword is required');
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    const bytes = CryptoJS.AES.decrypt(user.password, process.env.SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (decrypted !== currentPassword) {
      return sendError(res, 401, 'INVALID_PASSWORD', 'Current password is incorrect');
    }

    const profiles = await Profile.find({ userId: req.user.id }, { _id: 1 });
    const profileIds = profiles.map((x) => x._id);

    await Promise.all([
      UserSetting.deleteMany({ userId: req.user.id }),
      Notification.deleteMany({ userId: req.user.id }),
      MyListItem.deleteMany({ profileId: { $in: profileIds } }),
      WatchProgress.deleteMany({ profileId: { $in: profileIds } }),
      WatchHistory.deleteMany({ profileId: { $in: profileIds } }),
      DownloadItem.deleteMany({ profileId: { $in: profileIds } }),
      ContentPreference.deleteMany({ profileId: { $in: profileIds } }),
      Profile.deleteMany({ userId: req.user.id }),
      User.findByIdAndDelete(req.user.id),
    ]);

    res.status(200).json({ success: true });
  } catch (err) {
    sendError(res, 500, 'ACCOUNT_DELETE_FAILED', 'Failed to delete account', err);
  }
});

router.get('/content-preference', verify, async (req, res) => {
  const { profileId, contentId } = req.query;
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
      return sendError(res, 403, 'FORBIDDEN', 'Not authorized for this profile');
    }
    const content = await Movie.findById(contentId);
    if (!content) {
      return sendError(res, 404, 'CONTENT_NOT_FOUND', 'Content not found');
    }

    const row = await ContentPreference.findOne({ profileId, contentId });
    if (!row) {
      return res.status(200).json({
        profileId,
        contentId,
        audioLanguage: 'vi',
        subtitleLanguage: 'vi',
        subtitleEnabled: true,
      });
    }
    res.status(200).json(row);
  } catch (err) {
    sendError(
      res,
      500,
      'CONTENT_PREFERENCE_FETCH_FAILED',
      'Failed to fetch content preference',
      err
    );
  }
});

router.put('/content-preference', verify, async (req, res) => {
  const { profileId, contentId } = req.body;
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
      return sendError(res, 403, 'FORBIDDEN', 'Not authorized for this profile');
    }
    const content = await Movie.findById(contentId);
    if (!content) {
      return sendError(res, 404, 'CONTENT_NOT_FOUND', 'Content not found');
    }

    const allowFields = ['audioLanguage', 'subtitleLanguage', 'subtitleEnabled'];
    const data = {};
    allowFields.forEach((key) => {
      if (typeof req.body[key] !== 'undefined') data[key] = req.body[key];
    });

    const updated = await ContentPreference.findOneAndUpdate(
      { profileId, contentId },
      { $set: data, $setOnInsert: { profileId, contentId } },
      { upsert: true, new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    sendError(
      res,
      500,
      'CONTENT_PREFERENCE_UPDATE_FAILED',
      'Failed to update content preference',
      err
    );
  }
});

module.exports = router;
