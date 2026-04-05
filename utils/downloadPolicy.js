const QUALITY_ORDER = { sd: 1, hd: 2, fhd: 3 };

const ALLOWED_TRANSITIONS = {
  queued: new Set(['downloading', 'failed']),
  downloading: new Set(['paused', 'done', 'failed']),
  paused: new Set(['downloading', 'failed']),
  failed: new Set(['queued']),
  done: new Set([]),
};

function canTransition(from, to) {
  if (!from || !to || from === to) return true;
  const next = ALLOWED_TRANSITIONS[from];
  return Boolean(next && next.has(to));
}

function isQualityAllowed(requested, maxAllowed) {
  if (!requested || !maxAllowed) return true;
  return (QUALITY_ORDER[requested] || 0) <= (QUALITY_ORDER[maxAllowed] || 0);
}

module.exports = {
  ALLOWED_TRANSITIONS,
  canTransition,
  isQualityAllowed,
};
