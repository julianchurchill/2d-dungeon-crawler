import { Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { DIR, DIR_DELTA } from '../../src/utils/Direction.js';

Then('DIR.UP should equal {string}', function (expected) {
  assert.equal(DIR.UP, expected);
});

Then('DIR.DOWN should equal {string}', function (expected) {
  assert.equal(DIR.DOWN, expected);
});

Then('DIR.LEFT should equal {string}', function (expected) {
  assert.equal(DIR.LEFT, expected);
});

Then('DIR.RIGHT should equal {string}', function (expected) {
  assert.equal(DIR.RIGHT, expected);
});

Then('the UP direction delta should have dx {int} and dy {int}', function (dx, dy) {
  assert.equal(DIR_DELTA[DIR.UP].dx, dx, `Expected UP dx=${dx}`);
  assert.equal(DIR_DELTA[DIR.UP].dy, dy, `Expected UP dy=${dy}`);
});

Then('the DOWN direction delta should have dx {int} and dy {int}', function (dx, dy) {
  assert.equal(DIR_DELTA[DIR.DOWN].dx, dx, `Expected DOWN dx=${dx}`);
  assert.equal(DIR_DELTA[DIR.DOWN].dy, dy, `Expected DOWN dy=${dy}`);
});

Then('the LEFT direction delta should have dx {int} and dy {int}', function (dx, dy) {
  assert.equal(DIR_DELTA[DIR.LEFT].dx, dx, `Expected LEFT dx=${dx}`);
  assert.equal(DIR_DELTA[DIR.LEFT].dy, dy, `Expected LEFT dy=${dy}`);
});

Then('the RIGHT direction delta should have dx {int} and dy {int}', function (dx, dy) {
  assert.equal(DIR_DELTA[DIR.RIGHT].dx, dx, `Expected RIGHT dx=${dx}`);
  assert.equal(DIR_DELTA[DIR.RIGHT].dy, dy, `Expected RIGHT dy=${dy}`);
});
