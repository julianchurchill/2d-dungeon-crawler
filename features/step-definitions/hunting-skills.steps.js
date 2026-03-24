import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { HuntingSkill } from '../../src/skills/HuntingSkill.js';

Given('a HuntingSkill for {string}', function (skillKey) {
  this.skill = new HuntingSkill(skillKey);
});

When('a hunting skill attack of {int} is applied against a {string}', function (damage, target) {
  this.damageResult = this.skill.applyOnHit(damage, null, target);
});

When('a hunting skill attack of {int} is applied against a null defender', function (damage) {
  this.damageResult = this.skill.applyOnHit(damage, null, null);
});

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
