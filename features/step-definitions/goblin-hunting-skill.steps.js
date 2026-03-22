/**
 * Step definitions for the GoblinHuntingSkill and its SkillSystem integration.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { GoblinHuntingSkill } from '../../src/skills/GoblinHuntingSkill.js';
import { SkillSystem } from '../../src/systems/SkillSystem.js';

// Minimal stub RNG — Goblin Hunting uses no RNG rolls.
const stubRng = {};

// ── Given ─────────────────────────────────────────────────────────────────────

Given('a Goblin Hunting skill', function () {
  this.skill = new GoblinHuntingSkill();
});

Given('a skill system with no skills', function () {
  this.skillSystem = new SkillSystem(stubRng, [], []);
});

Given('a skill system with Goblin Hunting active', function () {
  const skill = new GoblinHuntingSkill();
  this.skillSystem = new SkillSystem(stubRng, [skill], []);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('it is applied to an attack of {int} damage against a goblin', function (damage) {
  this.result = this.skill.applyOnHit(damage, stubRng, 'goblin');
});

When('it is applied to an attack of {int} damage against an orc', function (damage) {
  this.result = this.skill.applyOnHit(damage, stubRng, 'orc');
});

When('it is applied to an attack of {int} damage against an unknown defender', function (damage) {
  this.result = this.skill.applyOnHit(damage, stubRng, null);
});

When('a Goblin Hunting skill is unlocked as a permanent skill', function () {
  this.skillSystem.unlockPermanentSkill(new GoblinHuntingSkill());
});

When('the skill system processes a hit of {int} damage against a goblin', function (damage) {
  this.skillResult = this.skillSystem.applyOnHitSkills(damage, 'goblin');
});

When('the skill system processes a hit of {int} damage against an orc', function (damage) {
  this.skillResult = this.skillSystem.applyOnHitSkills(damage, 'orc');
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the resulting damage is {int}', function (expected) {
  assert.equal(this.result.damage, expected);
});

Then('the Goblin Hunting skill cannot be upgraded', function () {
  assert.equal(this.skill.canUpgrade(), false);
});

Then('the Goblin Hunting skill cannot be downgraded', function () {
  assert.equal(this.skill.canDowngrade(), false);
});

Then('the Goblin Hunting description mentions {string}', function (text) {
  const data = this.skill.toData();
  assert.ok(data.description.toLowerCase().includes(text.toLowerCase()),
    `Expected description "${data.description}" to include "${text}"`);
});

Then('the goblin hunting skill system damage is {int}', function (expected) {
  assert.equal(this.skillResult.damage, expected);
});

Then('the unlocked skill system has {int} active skill(s)', function (count) {
  assert.equal(this.skillSystem.getSkills().length, count);
});

Then('the Goblin Hunting skill is in the active skills', function () {
  const skills = this.skillSystem.getSkills();
  assert.ok(skills.some(s => s.name === 'Goblin Hunting'),
    'Expected "Goblin Hunting" to be in active skills');
});
