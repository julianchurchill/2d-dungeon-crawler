/**
 * Step definitions for the esc-panel-close feature.
 *
 * Tests the pure `applyEscPanelClose` helper using a real TurnManager
 * so that state transitions are verified directly on the manager.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { applyEscPanelClose } from '../../src/systems/EscPanelClose.js';
import { TurnManager, TURN_STATE } from '../../src/systems/TurnManager.js';

// ── Given ─────────────────────────────────────────────────────────────────────

Given('the turn state is SKILLS', function () {
  this.turnManager = new TurnManager();
  this.turnManager.setState(TURN_STATE.SKILLS);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('ESC closes the active panel', function () {
  this.escAction = applyEscPanelClose(this.turnManager);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the panel close action should be {string}', function (expected) {
  assert.equal(this.escAction, expected);
});

Then('no panel close action should occur', function () {
  assert.equal(this.escAction, null);
});
