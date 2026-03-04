/**
 * Step definitions for application version string formatting.
 *
 * AppVersion.formatVersionString is pure logic with no Phaser or Vite
 * dependency, so no mocking is required.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { formatVersionString } from '../../src/utils/AppVersion.js';

Given(
  'a version {string}, commit hash {string}, and build date {string}',
  function (version, commit, buildDate) {
    this.version   = version;
    this.commit    = commit;
    this.buildDate = buildDate;
  },
);

When('the version string is formatted', function () {
  this.result = formatVersionString(this.version, this.commit, this.buildDate);
});

Then('the version string is {string}', function (expected) {
  assert.equal(this.result, expected);
});
