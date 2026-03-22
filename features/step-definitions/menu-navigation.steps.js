import { Given, When, Then, Before } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { MenuNavigator } from '../../src/utils/MenuNavigator.js';

const state = {};

Before(function () {
  Object.keys(state).forEach(k => delete state[k]);
});

Given('a menu navigator with {int} item(s)', function (count) {
  state.nav = new MenuNavigator(count);
});

When('the navigator moves down', function () {
  state.nav.next();
});

When('the navigator moves up', function () {
  state.nav.prev();
});

Then('the focused index is {int}', function (expected) {
  assert.equal(state.nav.focusedIndex, expected);
});
