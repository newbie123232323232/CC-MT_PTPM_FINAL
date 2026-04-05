const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const verify = require('../verifyToken');
const { assertProfileOwner } = require('../utils/profileOwnership');

test('verifyToken passes with valid bearer token', async () => {
  const previous = process.env.SECRET_KEY;
  process.env.SECRET_KEY = 'unit-test-secret';

  const token = jwt.sign({ id: 'u1', isAdmin: false }, process.env.SECRET_KEY);
  const req = { headers: { token: `Bearer ${token}` } };
  let nextCalled = false;
  const res = {
    status() {
      throw new Error('status() should not be called');
    },
  };

  await new Promise((resolve, reject) => {
    try {
      verify(req, res, () => {
        nextCalled = true;
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 'u1');
  process.env.SECRET_KEY = previous;
});

test('verifyToken passes with token in query (SSE)', async () => {
  const previous = process.env.SECRET_KEY;
  process.env.SECRET_KEY = 'unit-test-secret';

  const token = jwt.sign({ id: 'u2', isAdmin: false }, process.env.SECRET_KEY);
  const req = { headers: {}, query: { token } };
  let nextCalled = false;
  const res = {
    status() {
      throw new Error('status() should not be called');
    },
  };

  await new Promise((resolve, reject) => {
    try {
      verify(req, res, () => {
        nextCalled = true;
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 'u2');
  process.env.SECRET_KEY = previous;
});

test('verifyToken rejects when token is missing', async () => {
  const req = { headers: {}, query: {} };
  let statusCode = null;
  let payload = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    },
  };

  verify(req, res, () => {});
  assert.equal(statusCode, 401);
  assert.deepEqual(payload, { message: 'You are not authenticated' });
});

test('assertProfileOwner returns true for matching user', async () => {
  const ProfileModel = {
    async findById() {
      return { userId: 'abc' };
    },
  };
  const result = await assertProfileOwner(ProfileModel, 'p1', 'abc');
  assert.equal(result, true);
});

test('assertProfileOwner returns false for missing profile', async () => {
  const ProfileModel = {
    async findById() {
      return null;
    },
  };
  const result = await assertProfileOwner(ProfileModel, 'p1', 'abc');
  assert.equal(result, false);
});
