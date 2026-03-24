/**
 * Step definitions for the generic HuntingSkill and its SkillSystem integration.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { HuntingSkill } from '../../src/skills/HuntingSkill.js';
import { SkillSystem } from '../../src/systems/SkillSystem.js';

// Minimal stub RNG — HuntingSkill uses no RNG rolls.
const stubRng = {};

// ── Given ─────────────────────────────────────────────────────────────────────

Given('a HuntingSkill for {string}', function (skillKey) {
  this.skill = new HuntingSkill(skillKey);
});

Given('a skill system with no skills', function () {
  this.skillSystem = new SkillSystem(stubRng, [], []);
});

Given('a skill system with {string} active', function (skillKey) {
  this.skillSystem = new SkillSystem(stubRng, [new HuntingSkill(skillKey)], []);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('a hunting skill attack of {int} is applied against a {string}', function (damage, target) {
  this.damageResult = this.skill.applyOnHit(damage, null, target);
});

When('a hunting skill attack of {int} is applied against a null defender', function (damage) {
  this.damageResult = this.skill.applyOnHit(damage, null, null);
});

When('a HuntingSkill for {string} is unlocked as a permanent skill', function (skillKey) {
  this.skillSystem.unlockPermanentSkill(new HuntingSkill(skillKey));
});

When('the skill system processes a hit of {int} damage against a {string}', function (damage, target) {
  this.skillSystemResult = this.skillSystem.applyOnHitSkills(damage, target);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the hunting skill damage result is {int}', function (expected) {
  assert.equal(this.damageResult.damage, expected);
});

Then('the hunting skill cannot be upgraded', function () {
  assert.equal(this.skill.canUpgrade(), false);
});

Then('the hunting skill cannot be downgraded', function () {
  assert.equal(this.skill.canDowngrade(), false);
});

Then('the hunting skill description mentions {string}', function (keyword) {
  const { description } = this.skill.toData();
  assert.ok(description.includes(keyword),
    `Expected description "${description}" to mention "${keyword}"`);
});

Then('the unlocked skill system has {int} active skill(s)', function (count) {
  assert.equal(this.skillSystem.getSkills().length, count);
});

Then('{string} is in the active skills', function (skillName) {
  const skills = this.skillSystem.getSkills();
  assert.ok(skills.some(s => s.name === skillName),
    `Expected "${skillName}" to be in active skills`);
});

Then('the skill system damage result is {int}', function (expected) {
  assert.equal(this.skillSystemResult.damage, expected);
});
