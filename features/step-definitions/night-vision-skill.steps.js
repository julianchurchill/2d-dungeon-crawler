/**
 * Step definitions for the NightVisionSkill and its SkillSystem integration.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { NightVisionSkill } from '../../src/skills/NightVisionSkill.js';
import { SkillSystem } from '../../src/systems/SkillSystem.js';

// Minimal stub RNG — Night Vision uses no RNG rolls.
const stubRng = {};

// ── Given ─────────────────────────────────────────────────────────────────────

Given('a Night Vision skill', function () {
  this.nightVisionSkill = new NightVisionSkill();
});

Given('a skill system with Night Vision active', function () {
  const skill = new NightVisionSkill();
  this.skillSystem = new SkillSystem(stubRng, [skill], []);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the night vision skill is upgraded', function () {
  this.nightVisionSkill.upgrade();
});

When('the skill system upgrades the night vision skill', function () {
  this.skillSystem.upgradeSkill('night_vision');
});

When('a Night Vision skill is unlocked into the pool', function () {
  this.skillSystem.unlockSkill(new NightVisionSkill());
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the night vision FOV bonus should be {int}', function (expected) {
  assert.equal(this.nightVisionSkill.getFovBonus(), expected);
});

Then('the night vision skill can be upgraded', function () {
  assert.equal(this.nightVisionSkill.canUpgrade(), true);
});

Then('the night vision skill cannot be downgraded', function () {
  assert.equal(this.nightVisionSkill.canDowngrade(), false);
});

Then('the skill system FOV bonus should be {int}', function (expected) {
  assert.equal(this.skillSystem.getFovBonus(), expected);
});

Then('the skill system inactive pool should contain {int} skill', function (expected) {
  assert.equal(this.skillSystem.getInactiveSkills().length, expected);
});

Then('the inactive skills should include {string}', function (skillId) {
  const ids = this.skillSystem.getInactiveSkills().map(s => s.id);
  assert.ok(ids.includes(skillId), `Expected inactive skills to include "${skillId}" but got [${ids.join(', ')}]`);
});
