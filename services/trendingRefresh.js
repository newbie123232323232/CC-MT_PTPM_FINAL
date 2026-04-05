const ViewEvent = require('../models/ViewEvent');
const List = require('../models/List');

const TRENDING_TITLE = 'Trending Now';
const WINDOW_DAYS = 10;
const TOP_LIMIT = 30;

async function refreshTrendingNowFromViews() {
  const since = new Date();
  since.setDate(since.getDate() - WINDOW_DAYS);

  const agg = await ViewEvent.aggregate([
    { $match: { at: { $gte: since } } },
    { $group: { _id: '$contentId', views: { $sum: 1 } } },
    { $sort: { views: -1 } },
    { $limit: TOP_LIMIT },
  ]);

  const ids = agg.map((x) => x._id).filter(Boolean);
  if (!ids.length) return { updated: false, reason: 'no_views' };

  const list = await List.findOneAndUpdate(
    { title: TRENDING_TITLE },
    { $set: { content: ids } },
    { new: true }
  );

  if (!list) {
    await List.create({
      title: TRENDING_TITLE,
      type: 'movie',
      genre: 'Action',
      content: ids,
    });
  }

  return { updated: true, count: ids.length };
}

module.exports = {
  refreshTrendingNowFromViews,
  TRENDING_TITLE,
  WINDOW_DAYS,
};
