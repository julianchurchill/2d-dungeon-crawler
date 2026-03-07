import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { isDevEnvironment } from '../../src/utils/Environment.js';

/**
 * Step definitions for dev environment detection.
 * Injects a mock env object so tests can control the DEV flag
 * without depending on the actual Vite build environment.
 */

Given('the environment has DEV set to true', function () {
  this.mockEnv = { DEV: true };
});

Given('the environment has DEV set to false', function () {
  this.mockEnv = { DEV: false };
});

Then('the dev environment check should return true', function () {
  assert.strictEqual(isDevEnvironment(this.mockEnv), true);
});

Then('the dev environment check should return false', function () {
  assert.strictEqual(isDevEnvironment(this.mockEnv), false);
});
