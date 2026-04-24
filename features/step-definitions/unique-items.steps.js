import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { Player } from '../../src/entities/Player.js';
import { ShopSystem } from '../../src/systems/ShopSystem.js';

// Note: the following steps are defined in shop.steps.js and reused here:
//   Given a player with a short sword in their inventory
//   Given a weapon shop / an armour shop
//   When the player sells the short sword at the weapon shop
//   Then the player should have {int} gold

Given('the Bone Blade item type', function () {
  this.item = new Item(0, 0, ITEM_TYPES.BONE_BLADE);
});

Then('the item should be marked as unique', function () {
  assert.ok(this.item.unique === true, `Expected item.unique to be true, got ${this.item.unique}`);
});

Then('the item should not be marked as unique', function () {
  assert.ok(!this.item.unique, `Expected item.unique to be falsy, got ${this.item.unique}`);
});

Given('a player with a Bone Blade in their inventory', function () {
  this.player = new Player(0, 0);
  this.boneBlade = new Item(0, 0, ITEM_TYPES.BONE_BLADE);
  this.player.addItem(this.boneBlade);
});

Given('a player with a Skeleton Shield in their inventory', function () {
  this.player = new Player(0, 0);
  this.skeletonShield = new Item(0, 0, ITEM_TYPES.SKELETON_SHIELD);
  this.player.addItem(this.skeletonShield);
});

When('the player tries to sell the Bone Blade at the weapon shop', function () {
  this.saleResult = this.shop.sell(this.player, this.boneBlade);
});

When('the player tries to sell the Skeleton Shield at the armour shop', function () {
  this.saleResult = this.shop.sell(this.player, this.skeletonShield);
});

Then('the sale should fail', function () {
  assert.equal(this.saleResult, 0, `Expected sale to return 0 (fail), got ${this.saleResult}`);
});

Then('the player should have gold equal to the sword sell price', function () {
  assert.equal(this.player.gold, ITEM_TYPES.SWORD.sellPrice);
});

Given('the Key to Elsewhere item type', function () {
  this.item = new Item(0, 0, ITEM_TYPES.KEY_TO_ELSEWHERE);
});

Then('the item should not be equippable', function () {
  assert.equal(this.item.isEquipment(), false, 'Expected item.isEquipment() to be false');
});

Then('the item should have no attack bonus', function () {
  assert.ok(!this.item.attackBonus, `Expected no attackBonus, got ${this.item.attackBonus}`);
});

Then('the item should have no defense bonus', function () {
  assert.ok(!this.item.defenseBonus, `Expected no defenseBonus, got ${this.item.defenseBonus}`);
});
