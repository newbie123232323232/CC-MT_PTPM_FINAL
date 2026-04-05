const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.INTEGRATION_BASE_URL || 'http://localhost:5000';
const EMAIL = process.env.INTEGRATION_EMAIL || 'seed-admin@zetflix.local';
const PASSWORD = process.env.INTEGRATION_PASSWORD || '12345678';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    body = null;
  }
  return { status: res.status, body };
}

test('integration flow: auth -> profile -> playback -> notifications', async (t) => {
  const health = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (health.status !== 200 || !health.body?.accessToken) {
    t.skip(
      'Skipping integration flow: API not ready or seed user missing. Run `npm run seed:phase1` and start API.'
    );
    return;
  }

  const token = health.body.accessToken;
  const authHeaders = {
    'Content-Type': 'application/json',
    token: `Bearer ${token}`,
  };

  const profileCreate = await request('/profiles', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: `integration-${Date.now()}`, isKid: false }),
  });
  assert.equal(profileCreate.status, 201);
  const profileId = profileCreate.body._id;

  const homeFeed = await request(`/home?profileId=${profileId}`, {
    method: 'GET',
    headers: { token: `Bearer ${token}` },
  });
  assert.equal(homeFeed.status, 200);

  const content = homeFeed.body?.hero || homeFeed.body?.rails?.[0]?.items?.[0];
  assert.ok(content?._id, 'Expected at least one content item');
  const contentId = content._id;

  const playbackStart = await request('/playback/start', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ profileId, contentId, contentType: 'movie' }),
  });
  assert.equal(playbackStart.status, 200);

  const playbackProgress = await request('/playback/progress', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      profileId,
      contentId,
      contentType: 'movie',
      positionSec: 120,
      durationSec: 1000,
    }),
  });
  assert.equal(playbackProgress.status, 200);

  const notifications = await request(`/notifications?profileId=${profileId}`, {
    method: 'GET',
    headers: { token: `Bearer ${token}` },
  });
  assert.equal(notifications.status, 200);
  assert.ok(Array.isArray(notifications.body.items));
});
