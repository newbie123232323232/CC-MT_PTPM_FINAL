const test = require('node:test');
const assert = require('node:assert/strict');

function pickNextEpisode(current, sameSeasonEpisodes, nextSeasonEpisodes) {
  const inSeason = [...sameSeasonEpisodes]
    .filter((e) => e.episodeNumber > current.episodeNumber)
    .sort((a, b) => a.episodeNumber - b.episodeNumber)[0];
  if (inSeason) return inSeason;
  const fromNextSeason = [...nextSeasonEpisodes].sort(
    (a, b) => a.episodeNumber - b.episodeNumber
  )[0];
  return fromNextSeason || null;
}

test('pick next episode in same season first', () => {
  const current = { episodeNumber: 2 };
  const same = [{ episodeNumber: 3 }, { episodeNumber: 4 }];
  const next = [{ episodeNumber: 1 }];
  const picked = pickNextEpisode(current, same, next);
  assert.equal(picked.episodeNumber, 3);
});

test('fallback to first episode of next season', () => {
  const current = { episodeNumber: 10 };
  const same = [];
  const next = [{ episodeNumber: 2 }, { episodeNumber: 1 }];
  const picked = pickNextEpisode(current, same, next);
  assert.equal(picked.episodeNumber, 1);
});

test('returns null if no next episode exists', () => {
  const current = { episodeNumber: 10 };
  const picked = pickNextEpisode(current, [], []);
  assert.equal(picked, null);
});
