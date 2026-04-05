const test = require('node:test');
const assert = require('node:assert/strict');
const { canTransition, isQualityAllowed } = require('../utils/downloadPolicy');

test('download state transition allows queued -> downloading', () => {
  assert.equal(canTransition('queued', 'downloading'), true);
});

test('download state transition blocks done -> downloading', () => {
  assert.equal(canTransition('done', 'downloading'), false);
});

test('quality policy allows lower or equal quality', () => {
  assert.equal(isQualityAllowed('sd', 'hd'), true);
  assert.equal(isQualityAllowed('hd', 'hd'), true);
});

test('quality policy blocks quality above allowed cap', () => {
  assert.equal(isQualityAllowed('fhd', 'hd'), false);
});
