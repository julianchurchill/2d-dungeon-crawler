import { Given, When, Then, Before } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { SkillSystem } from '../../src/systems/SkillSystem.js';
import { applySkillsToggle } from '../../src/systems/SkillsToggle.js';
import { resolveMeleeAttack } from '../../src/systems/CombatSystem.js';
import { TurnManager, TURN_STATE } from '../../src/systems/TurnManager.js';

// ─── Shared state ────────────────────────────────────────────────────────────

const state = {};

Before(function () {
  Object.keys(state).forEach(k => delete state[k]);
});

// ─── RNG stubs ───────────────────────────────────────────────────────────────

/** Always returns 0 for nextInt (no variance) and true for nextBool (skill always triggers). */
const luckyRNG = { nextInt: () => 0, nextBool: () => true };

/** Always returns 0 for nextInt and false for nextBool (skill never triggers). */
const unluckyRNG = { nextInt: () => 0, nextBool: () => false };

// ─── SkillSystem steps ───────────────────────────────────────────────────────

Given('a new skill system', function () {
  state.skillSystem = new SkillSystem(unluckyRNG);
});

Given('a skill system where Lucky Strike always triggers', function () {
  state.skillSystem = new SkillSystem(luckyRNG);
});

Given('a skill system where Lucky Strike never triggers', function () {
  state.skillSystem = new SkillSystem(unluckyRNG);
});

When('the skill system processes a hit of {int} damage', function (damage) {
  state.skillResult = state.skillSystem.applyOnHitSkills(damage);
});

Then('the skill system has {int} active skill(s)', function (count) {
  assert.equal(state.skillSystem.getSkills().length, count);
});

Then('the skill {string} is active', function (name) {
  const skills = state.skillSystem.getSkills();
  assert.ok(skills.some(s => s.name === name), `Expected skill "${name}" to be active`);
});

Then('the Lucky Strike skill has a {int}% trigger chance', function (pct) {
  const skill = state.skillSystem.getSkills().find(s => s.name === 'Lucky Strike');
  assert.ok(skill, 'Lucky Strike skill not found');
  assert.ok(
    Math.abs(skill.critChance - pct / 100) < 1e-9,
    `Expected critChance ~${pct / 100} but got ${skill.critChance}`,
  );
});

Then('the Lucky Strike skill has a 1.5x damage multiplier', function () {
  const skill = state.skillSystem.getSkills().find(s => s.name === 'Lucky Strike');
  assert.ok(skill, 'Lucky Strike skill not found');
  assert.equal(skill.damageMultiplier, 1.5);
});

Then('the resulting skill damage is {int}', function (expected) {
  assert.equal(state.skillResult.damage, expected);
});

Then('the skill message {string} is returned', function (message) {
  assert.ok(
    state.skillResult.messages.includes(message),
    `Expected message "${message}" but got [${state.skillResult.messages.join(', ')}]`,
  );
});

Then('no skill messages are returned', function () {
  assert.equal(
    state.skillResult.messages.length, 0,
    `Expected no skill messages but got [${state.skillResult.messages.join(', ')}]`,
  );
});

// ─── CombatSystem integration steps ─────────────────────────────────────────

/** Minimal mock defender with no defense: takeDamage returns raw value. */
function makeMockDefender() {
  return {
    name: 'goblin',
    _hp: 100,
    takeDamage(dmg) { this._hp -= dmg; return dmg; },
    isDead() { return this._hp <= 0; },
  };
}

When('the player attacks an enemy for {int} base damage using the skill system', function (atkPower) {
  const attacker = { attackPower: atkPower, skillSystem: state.skillSystem };
  const defender = makeMockDefender();
  state.combatResult = resolveMeleeAttack(attacker, defender, unluckyRNG);
});

When('the player attacks an enemy for {int} base damage without a skill system', function (atkPower) {
  const attacker = { attackPower: atkPower };
  const defender = makeMockDefender();
  state.combatResult = resolveMeleeAttack(attacker, defender, unluckyRNG);
});

Then('the combat damage is {int}', function (expected) {
  assert.equal(state.combatResult.damage, expected);
});

Then('the combat result includes skill message {string}', function (message) {
  assert.ok(
    state.combatResult.messages.includes(message),
    `Expected skill message "${message}" but got [${state.combatResult.messages.join(', ')}]`,
  );
});

Then('the combat result has no skill messages', function () {
  // Without a skill system, messages contains only the single combat message.
  assert.equal(
    state.combatResult.messages.length, 1,
    `Expected only the combat message but got [${state.combatResult.messages.join(', ')}]`,
  );
});

// ─── SkillSystem upgrade steps ───────────────────────────────────────────────

Given('a skill system with Lucky Strike at the crit cap', function () {
  state.skillSystem = new SkillSystem(unluckyRNG);
  // Drive baseCritChance to the cap via repeated upgrades.
  while (state.skillSystem.canUpgrade('lucky_strike')) {
    state.skillSystem.upgradeSkill('lucky_strike');
  }
});

When('Lucky Strike is upgraded', function () {
  state.upgradeResult = state.skillSystem.upgradeSkill('lucky_strike');
});

When('the skill {string} is upgraded', function (skillId) {
  state.upgradeResult = state.skillSystem.upgradeSkill(skillId);
});

Then('the upgrade result is true', function () {
  assert.equal(state.upgradeResult, true);
});

Then('the upgrade result is false', function () {
  assert.equal(state.upgradeResult, false);
});

Then('the Lucky Strike skill description contains {string}', function (text) {
  const skill = state.skillSystem.getSkills().find(s => s.name === 'Lucky Strike');
  assert.ok(skill, 'Lucky Strike skill not found');
  assert.ok(
    skill.description.includes(text),
    `Expected description to contain "${text}" but got: "${skill.description}"`,
  );
});

Then('Lucky Strike can be upgraded', function () {
  assert.equal(state.skillSystem.canUpgrade('lucky_strike'), true);
});

Then('Lucky Strike cannot be upgraded', function () {
  assert.equal(state.skillSystem.canUpgrade('lucky_strike'), false);
});

When('Lucky Strike is downgraded', function () {
  state.downgradeResult = state.skillSystem.downgradeSkill('lucky_strike');
});

Then('the downgrade result is true', function () {
  assert.equal(state.downgradeResult, true);
});

Then('the downgrade result is false', function () {
  assert.equal(state.downgradeResult, false);
});

Then('Lucky Strike can be downgraded', function () {
  assert.equal(state.skillSystem.canDowngrade('lucky_strike'), true);
});

Then('Lucky Strike cannot be downgraded', function () {
  assert.equal(state.skillSystem.canDowngrade('lucky_strike'), false);
});

Then('the inactive skills list is empty', function () {
  assert.deepEqual(state.skillSystem.getInactiveSkills(), []);
});

// ─── SkillsToggle steps ──────────────────────────────────────────────────────

Given('the turn state is {string}', function (turnState) {
  state.turnManager = new TurnManager();
  state.turnManager.setState(TURN_STATE[turnState]);
});

When('the skills toggle is applied', function () {
  state.toggleResult = applySkillsToggle(state.turnManager);
});

Then('the turn state should become {string}', function (expected) {
  assert.equal(state.turnManager.state, TURN_STATE[expected]);
});

Then('the turn state should remain {string}', function (expected) {
  assert.equal(state.turnManager.state, TURN_STATE[expected]);
});

Then('the skills toggle should return true', function () {
  assert.equal(state.toggleResult, true);
});

Then('the skills toggle should return false', function () {
  assert.equal(state.toggleResult, false);
});
