const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const UserSetting = require('../models/UserSetting');
const Movie = require('../models/Movie');
const Episode = require('../models/Episode');
const WatchHistory = require('../models/WatchHistory');
const { emitNotificationEvent } = require('./realtime');

function allowNewReleaseNotification(setting) {
  if (!setting) return true;
  if (setting.notificationEnabled === false) return false;
  if (setting.notifyNewRelease === false) return false;
  return true;
}

function allowNewEpisodeNotification(setting) {
  if (!setting) return true;
  if (setting.notificationEnabled === false) return false;
  if (setting.notifyNewEpisode === false) return false;
  return true;
}

function allowTrendingNotification(setting) {
  if (!setting) return true;
  if (setting.notificationEnabled === false) return false;
  if (setting.notifyTrending === false) return false;
  return true;
}

async function collectProfilesWithSettings() {
  const profiles = await Profile.find({}, { _id: 1, userId: 1 });
  if (!profiles.length) return { profiles: [], settingMap: new Map() };
  const profileIds = profiles.map((x) => x._id);
  const settings = await UserSetting.find(
    { profileId: { $in: profileIds } },
    {
      profileId: 1,
      notificationEnabled: 1,
      notifyNewRelease: 1,
      notifyNewEpisode: 1,
      notifyTrending: 1,
    }
  );
  const settingMap = new Map(settings.map((x) => [String(x.profileId), x]));
  return { profiles, settingMap };
}

async function notifyNewRelease(movie) {
  const { profiles, settingMap } = await collectProfilesWithSettings();
  if (!profiles.length) return [];

  const docs = profiles
    .filter((profile) =>
      allowNewReleaseNotification(settingMap.get(String(profile._id)))
    )
    .map((profile) => ({
      userId: profile.userId,
      profileId: profile._id,
      contentId: movie._id,
      kind: 'new_release',
      title: 'New release',
      body: `${movie.title} is now available`,
      read: false,
    }));

  if (!docs.length) return [];

  const inserted = await Notification.insertMany(docs);
  inserted.forEach((row) => emitNotificationEvent(row));
  return inserted;
}

async function notifyNewEpisode(series, episode) {
  const { profiles, settingMap } = await collectProfilesWithSettings();
  if (!profiles.length) return [];

  const docs = profiles
    .filter((profile) =>
      allowNewEpisodeNotification(settingMap.get(String(profile._id)))
    )
    .map((profile) => ({
      userId: profile.userId,
      profileId: profile._id,
      contentId: episode._id,
      kind: 'new_episode',
      title: 'New episode available',
      body: `${series.title} - Episode ${episode.episodeNumber} is now available`,
      read: false,
    }));

  if (!docs.length) return [];

  const inserted = await Notification.insertMany(docs);
  inserted.forEach((row) => emitNotificationEvent(row));
  return inserted;
}

async function generateTrendingNotifications({ days = 7, limit = 5 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const trendingRows = await WatchHistory.aggregate([
    { $match: { watchedAt: { $gte: since } } },
    { $group: { _id: '$contentId', total: { $sum: 1 }, contentType: { $last: '$contentType' } } },
    { $sort: { total: -1 } },
    { $limit: Math.max(1, Number(limit) || 5) },
  ]);

  if (!trendingRows.length) return { created: 0, targets: 0 };

  const movieIds = trendingRows
    .filter((x) => x.contentType !== 'episode')
    .map((x) => x._id);
  const episodeIds = trendingRows
    .filter((x) => x.contentType === 'episode')
    .map((x) => x._id);

  const [movies, episodes] = await Promise.all([
    movieIds.length ? Movie.find({ _id: { $in: movieIds } }, { _id: 1, title: 1 }) : [],
    episodeIds.length ? Episode.find({ _id: { $in: episodeIds } }, { _id: 1, title: 1, episodeNumber: 1 }) : [],
  ]);
  const contentTitleMap = new Map([
    ...movies.map((m) => [String(m._id), m.title]),
    ...episodes.map((e) => [String(e._id), e.title || `Episode ${e.episodeNumber}`]),
  ]);

  const { profiles, settingMap } = await collectProfilesWithSettings();
  if (!profiles.length) return { created: 0, targets: trendingRows.length };

  const docs = [];
  for (const profile of profiles) {
    const setting = settingMap.get(String(profile._id));
    if (!allowTrendingNotification(setting)) continue;
    for (const row of trendingRows) {
      docs.push({
        userId: profile.userId,
        profileId: profile._id,
        contentId: row._id,
        kind: 'trending',
        title: 'Trending now',
        body: `${contentTitleMap.get(String(row._id)) || 'A title'} is trending now`,
        read: false,
      });
    }
  }

  if (!docs.length) return { created: 0, targets: trendingRows.length };
  const inserted = await Notification.insertMany(docs);
  inserted.forEach((row) => emitNotificationEvent(row));
  return { created: inserted.length, targets: trendingRows.length };
}

module.exports = {
  notifyNewRelease,
  allowNewReleaseNotification,
  notifyNewEpisode,
  generateTrendingNotifications,
  allowNewEpisodeNotification,
  allowTrendingNotification,
};
