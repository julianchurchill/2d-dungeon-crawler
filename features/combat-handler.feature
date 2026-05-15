Feature: CombatHandler

  CombatHandler is responsible for all enemy-turn and combat-resolution logic
  extracted from GameScene and PlayerActionHandler: running enemy turns, resolving
  ranged projectiles, destroying enemies, spawning boss minions, and applying loot
  when enemies die. It accepts a scene reference and exposes each operation as a
  named method.

  # Documents that the type definition (not the Item instance) is handed to _placeItem
  # so it creates a correctly-typed Item from the type def. Passing an Item instance
  # causes the placed item's _typeDef to be an Item, breaking use() and isConsumable().
  # After save/load, dropItem is restored as an Item instance — _typeDef must be unwrapped.
  Scenario: applyChampionLoot passes the type definition to _placeItem, not the Item instance
    Given a CombatHandler with a champion carrying a SWORD drop item
    When applyChampionLoot is called with the champion
    Then the argument passed to _placeItem should not be an Item instance

  Scenario: applyBossLoot passes the type definition to _placeItem, not the Item instance
    Given a CombatHandler with a boss carrying a SWORD drop item
    When applyBossLoot is called with the boss
    Then the argument passed to _placeItem should not be an Item instance

  # On a fresh spawn, dropItem is already a raw type definition — it must pass through unchanged.
  Scenario: applyChampionLoot works correctly when dropItem is already a raw type definition
    Given a CombatHandler with a champion carrying a raw SWORD type definition as drop item
    When applyChampionLoot is called with the champion
    Then the argument passed to _placeItem should not be an Item instance

  Scenario: applyBossLoot works correctly when dropItem is already a raw type definition
    Given a CombatHandler with a boss carrying a raw SWORD type definition as drop item
    When applyBossLoot is called with the boss
    Then the argument passed to _placeItem should not be an Item instance

  Scenario: CombatHandler exposes the expected combat methods
    Given a CombatHandler bound to a minimal scene context
    Then the combat handler exposes startEnemyTurns
    And the combat handler exposes destroyEnemy
    And the combat handler exposes applyPendingRemovedSegments
    And the combat handler exposes spawnBossMinions
    And the combat handler exposes applyBossLoot
    And the combat handler exposes applyChampionLoot
