const { refreshTrendingNowFromViews } = require('./trendingRefresh');

function msUntilNextLocalMidnight() {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  t.setHours(0, 0, 0, 0);
  return t - Date.now();
}

function scheduleTrendingRefresh() {
  refreshTrendingNowFromViews()
    .then((r) => {
      if (r.updated) {
        console.log(`[trending] initial refresh: ${r.count} titles`);
      } else {
        console.log('[trending] initial refresh skipped:', r.reason);
      }
    })
    .catch((e) => console.error('[trending] initial refresh failed', e));

  const run = () => {
    refreshTrendingNowFromViews()
      .then((r) => console.log('[trending] midnight refresh', r))
      .catch((e) => console.error('[trending] midnight refresh failed', e));
  };

  setTimeout(() => {
    run();
    setInterval(run, 24 * 60 * 60 * 1000);
  }, msUntilNextLocalMidnight());
}

module.exports = { scheduleTrendingRefresh };
