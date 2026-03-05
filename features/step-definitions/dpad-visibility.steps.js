import { Given, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { isTouchDevice } from '../../src/utils/TouchDeviceDetector.js';

/**
 * Step definitions for D-pad visibility based on touch device detection.
 * Both navigator and matchMedia are injectable so tests can control touch
 * point counts and pointer precision without a real browser environment.
 */

Given('the device reports {int} touch point', function (points) {
  this.mockNavigator = { maxTouchPoints: points };
});

Given('the device reports {int} touch points', function (points) {
  this.mockNavigator = { maxTouchPoints: points };
});

Given('the device has a coarse pointer', function () {
  // Coarse pointer = touchscreen (finger); matchMedia returns matches: true
  this.mockMatchMedia = () => ({ matches: true });
});

Given('the device has a fine pointer', function () {
  // Fine pointer = mouse or touchpad; matchMedia returns matches: false
  this.mockMatchMedia = () => ({ matches: false });
});

Then('the device is detected as a touch device', function () {
  assert.strictEqual(isTouchDevice(this.mockNavigator, this.mockMatchMedia), true);
});

Then('the device is not detected as a touch device', function () {
  assert.strictEqual(isTouchDevice(this.mockNavigator, this.mockMatchMedia), false);
});
