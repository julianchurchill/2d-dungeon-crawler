Feature: CombatHandler

  CombatHandler is responsible for all enemy-turn and combat-resolution logic
  extracted from GameScene and PlayerActionHandler: running enemy turns, resolving
  ranged projectiles, destroying enemies, spawning boss minions, and applying loot
  when enemies die. It accepts a scene reference and exposes each operation as a
  named method.

  Scenario: CombatHandler exposes the expected combat methods
    Given a CombatHandler bound to a minimal scene context
    Then the combat handler exposes startEnemyTurns
    And the combat handler exposes destroyEnemy
    And the combat handler exposes applyPendingRemovedSegments
    And the combat handler exposes spawnBossMinions
    And the combat handler exposes applyBossLoot
    And the combat handler exposes applyChampionLoot
