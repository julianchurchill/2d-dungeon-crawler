/**
 * Step definitions for scene back-navigation feature.
 *
 * Tests the pure `resolveSceneBack` helper which determines what should
 * happen when a player presses Back/ESC on an in-game overlay screen.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { resolveSceneBack } from '../../src/systems/SceneNavigation.js';

// ── Given ─────────────────────────────────────────────────────────────────────

Given('the screen was opened from {string}', function (fromScene) {
  this.fromScene = fromScene;
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the back navigation is resolved', function () {
  this.backResult = resolveSceneBack(this.fromScene);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the back action should be {string}', function (action) {
  assert.equal(this.backResult.action, action);
});

Then('the back target should be {string}', function (scene) {
  assert.equal(this.backResult.scene, scene);
});
