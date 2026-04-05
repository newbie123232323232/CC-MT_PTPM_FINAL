const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isKidBlockedGenre,
  isContentAllowedForProfile,
} = require('../utils/contentPolicy');

test('kid blocked genres include horror (case-insensitive)', () => {
  assert.equal(isKidBlockedGenre('horror'), true);
  assert.equal(isKidBlockedGenre('Horror'), true);
});

test('kid blocked genres allow drama', () => {
  assert.equal(isKidBlockedGenre('Drama'), false);
});

test('content denied when maturity is exceeded', () => {
  const profile = { isKid: false, maturityLevel: 13 };
  const content = { genre: 'Action', limit: 16 };
  assert.equal(isContentAllowedForProfile(profile, content), false);
});

test('content denied for kid when genre is blocked', () => {
  const profile = { isKid: true, maturityLevel: 18 };
  const content = { genre: 'Thriller', limit: 13 };
  assert.equal(isContentAllowedForProfile(profile, content), false);
});

test('content allowed when kid profile and safe genre/limit', () => {
  const profile = { isKid: true, maturityLevel: 13 };
  const content = { genre: 'Animation', limit: 10 };
  assert.equal(isContentAllowedForProfile(profile, content), true);
});
