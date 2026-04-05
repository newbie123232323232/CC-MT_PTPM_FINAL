const KID_BLOCKED_GENRES = new Set([
  'Horror',
  'Thriller',
  'Crime',
  'War',
  '18+',
  'Mature',
]);

function normalizeGenre(genre) {
  return String(genre || '').trim().toLowerCase();
}

function isKidBlockedGenre(genre) {
  const g = normalizeGenre(genre);
  for (const blocked of KID_BLOCKED_GENRES) {
    if (g === blocked.toLowerCase()) return true;
  }
  return false;
}

function buildProfileContentFilter(profile) {
  if (!profile) return {};
  const clauses = [];
  if (typeof profile.maturityLevel === 'number') {
    clauses.push({
      $or: [
        { limit: { $exists: false } },
        { limit: null },
        { limit: { $lte: profile.maturityLevel } },
      ],
    });
  }
  if (profile.isKid) {
    clauses.push({
      genre: { $nin: Array.from(KID_BLOCKED_GENRES) },
    });
  }
  if (!clauses.length) return {};
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}

function isContentAllowedForProfile(profile, content) {
  if (!profile || !content) return true;
  if (
    typeof profile.maturityLevel === 'number' &&
    typeof content.limit === 'number' &&
    content.limit > profile.maturityLevel
  ) {
    return false;
  }
  if (profile.isKid && isKidBlockedGenre(content.genre)) {
    return false;
  }
  return true;
}

module.exports = {
  KID_BLOCKED_GENRES,
  isKidBlockedGenre,
  buildProfileContentFilter,
  isContentAllowedForProfile,
};
