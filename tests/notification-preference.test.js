const test = require('node:test');
const assert = require('node:assert/strict');
const {
  allowNewReleaseNotification,
} = require('../services/notificationService');

test('allow notification when no setting row exists', () => {
  assert.equal(allowNewReleaseNotification(null), true);
});

test('deny notification when notificationEnabled is false', () => {
  assert.equal(
    allowNewReleaseNotification({
      notificationEnabled: false,
      notifyNewRelease: true,
    }),
    false
  );
});

test('deny notification when notifyNewRelease is false', () => {
  assert.equal(
    allowNewReleaseNotification({
      notificationEnabled: true,
      notifyNewRelease: false,
    }),
    false
  );
});

test('allow notification when both flags are true', () => {
  assert.equal(
    allowNewReleaseNotification({
      notificationEnabled: true,
      notifyNewRelease: true,
    }),
    true
  );
});
