Feature: Ranged enemies

  Spitters and Skeleton Mages can fire ranged attacks at the player when
  cardinally aligned within range and unobstructed by opaque tiles. Spitters
  are acid-spitting creatures that appear from floor 10; Skeleton Mages gain
  a ranged bolt in addition to their existing teleport ability.

  # ── Spitter stats ─────────────────────────────────────────────────────────────

  Scenario: Spitter has the correct name
    Given a ranged enemy of type "spitter" at position 0, 0
    Then the ranged enemy name is "Spitter"

  Scenario: Spitter has ranged attack power of 5
    Given a ranged enemy of type "spitter" at position 0, 0
    Then the ranged enemy ranged attack power is 5

  Scenario: Spitter has ranged range of 3
    Given a ranged enemy of type "spitter" at position 0, 0
    Then the ranged enemy ranged range is 3

  # ── Spitter AI ────────────────────────────────────────────────────────────────

  Scenario: Spitter fires ranged attack when player is directly above within range
    Given a ranged enemy of type "spitter" at position 5, 5
    And a player target at position 5, 3
    And no opaque tiles blocking the shot
    When the ranged enemy takes its turn with wander suppressed
    Then the ranged action is "ranged_attack"
    And the ranged target is the player

  Scenario: Spitter fires ranged attack to the right when player is within range
    Given a ranged enemy of type "spitter" at position 5, 5
    And a player target at position 7, 5
    And no opaque tiles blocking the shot
    When the ranged enemy takes its turn with wander suppressed
    Then the ranged action is "ranged_attack"
    And the ranged target is the player

  Scenario: Spitter does not fire when player is out of range
    Given a ranged enemy of type "spitter" at position 5, 5
    And a player target at position 5, 1
    And no opaque tiles blocking the shot
    When the ranged enemy takes its turn with wander suppressed
    Then the ranged action is not "ranged_attack"

  Scenario: Spitter does not fire when an opaque tile blocks the path
    Given a ranged enemy of type "spitter" at position 5, 5
    And a player target at position 5, 3
    And an opaque tile at position 5, 4
    When the ranged enemy takes its turn with wander suppressed
    Then the ranged action is not "ranged_attack"

  Scenario: Spitter does not fire when player is not cardinally aligned
    Given a ranged enemy of type "spitter" at position 5, 5
    And a player target at position 4, 3
    And no opaque tiles blocking the shot
    When the ranged enemy takes its turn with wander suppressed
    Then the ranged action is not "ranged_attack"

  # ── Skeleton Mage ranged attack ───────────────────────────────────────────────

  Scenario: Skeleton Mage has ranged attack power
    Given a ranged enemy of type "skeleton_mage" at position 0, 0
    Then the ranged enemy ranged attack power is 6

  Scenario: Skeleton Mage has ranged range
    Given a ranged enemy of type "skeleton_mage" at position 0, 0
    Then the ranged enemy ranged range is 4

  Scenario: Skeleton Mage fires ranged attack when cardinally aligned within range
    Given a ranged enemy of type "skeleton_mage" at position 5, 5
    And a player target at position 5, 2
    And no opaque tiles blocking the shot
    When the skeleton mage takes its turn with teleport and wander suppressed
    Then the ranged action is "ranged_attack"
    And the ranged target is the player

  # ── Projectile colours ────────────────────────────────────────────────────────

  Scenario: Spitter has an acid-green projectile colour
    Given a ranged enemy of type "spitter" at position 0, 0
    Then the ranged enemy projectile colour is 8965154

  Scenario: Skeleton Mage has a purple projectile colour
    Given a ranged enemy of type "skeleton_mage" at position 0, 0
    Then the ranged enemy projectile colour is 13387007

  # ── Spawn table ───────────────────────────────────────────────────────────────

  Scenario: Spitter is not in the spawn table before floor 10
    Given the spawn table for floor 9
    Then "spitter" is not in the spawn table

  Scenario: Spitter appears in the spawn table from floor 10
    Given the spawn table for floor 10
    Then "spitter" is in the spawn table
