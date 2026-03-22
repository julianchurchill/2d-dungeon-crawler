import { Given, When, Then, Before } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { SkillSystem } from '../../src/systems/SkillSystem.js';
import { applySkillsToggle } from '../../src/systems/SkillsToggle.js';
import { resolveMeleeAttack } from '../../src/systems/CombatSystem.js';
import { TURN_STATE } from '../../src/systems/TurnManager.js';

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

Then('the Lucky Strike skill has a 1% trigger chance', function () {
  const skill = state.skillSystem.getSkills().find(s => s.name === 'Lucky Strike');
  assert.ok(skill, 'Lucky Strike skill not found');
  assert.equal(skill.baseCritChance, 0.01);
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
  const attacker = { attackPower: atkPower };
  const defender = makeMockDefender();
  state.combatResult = resolveMeleeAttack(attacker, defender, unluckyRNG, state.skillSystem);
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
    state.combatResult.skillMessages.includes(message),
    `Expected skill message "${message}" but got [${state.combatResult.skillMessages.join(', ')}]`,
  );
});

Then('the combat result has no skill messages', function () {
  assert.equal(
    state.combatResult.skillMessages.length, 0,
    `Expected no skill messages but got [${state.combatResult.skillMessages.join(', ')}]`,
  );
});

// ─── SkillsToggle steps ──────────────────────────────────────────────────────

Given('the turn state is {string}', function (turnState) {
  state.turnState = TURN_STATE[turnState];
});

When('the skills toggle is applied', function () {
  state.toggleResult = applySkillsToggle(
    state.turnState,
    () => { state.turnState = TURN_STATE.SKILLS; },
    () => { state.turnState = TURN_STATE.PLAYER_INPUT; },
  );
});

Then('the turn state should become {string}', function (expected) {
  assert.equal(state.turnState, TURN_STATE[expected]);
});

Then('the turn state should remain {string}', function (expected) {
  assert.equal(state.turnState, TURN_STATE[expected]);
});

Then('the skills toggle should return true', function () {
  assert.equal(state.toggleResult, true);
});

Then('the skills toggle should return false', function () {
  assert.equal(state.toggleResult, false);
});
