import { Given, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { isTouchDevice } from '../../src/utils/TouchDeviceDetector.js';

/**
 * Step definitions for D-pad visibility based on touch device detection.
 * The isTouchDevice function accepts an injectable navigator object so that
 * touch point counts can be controlled in tests without a real browser.
 */

Given('the device reports {int} touch point', function (points) {
  this.mockNavigator = { maxTouchPoints: points };
});

Given('the device reports {int} touch points', function (points) {
  this.mockNavigator = { maxTouchPoints: points };
});

Then('the device is detected as a touch device', function () {
  assert.strictEqual(isTouchDevice(this.mockNavigator), true);
});

Then('the device is not detected as a touch device', function () {
  assert.strictEqual(isTouchDevice(this.mockNavigator), false);
});
