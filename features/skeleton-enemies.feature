Feature: Skeleton-themed enemies on floors 10–15

  # ── Enemy definitions ────────────────────────────────────────────────────────

  Scenario: Skeleton Warrior has correct stats
    Then the skeleton_warrior enemy has name "Skeleton Warrior"
    And the skeleton_warrior enemy has hp 18
    And the skeleton_warrior enemy has attack 6
    And the skeleton_warrior enemy has defense 3
    And the skeleton_warrior enemy has xp 30

  Scenario: Skeleton Mage has correct stats
    Then the skeleton_mage enemy has name "Skeleton Mage"
    And the skeleton_mage enemy has hp 10
    And the skeleton_mage enemy has attack 5
    And the skeleton_mage enemy has defense 1
    And the skeleton_mage enemy has xp 25

  Scenario: Skeleton Mage has teleport ability
    Then the skeleton_mage enemy has teleportChance 0.3
    And the skeleton_mage enemy has teleportRange 4

  # ── Spawn table — floors 10–12 ───────────────────────────────────────────────

  Scenario: Skeletons do not appear before floor 10
    Given the spawn table for floor 9
    Then "skeleton" is not in the spawn table
    And "skeleton_warrior" is not in the spawn table
    And "skeleton_mage" is not in the spawn table

  Scenario: Skeleton appears from floor 10
    Given the spawn table for floor 10
    Then "skeleton" is in the spawn table

  Scenario: Skeleton Warrior appears from floor 10
    Given the spawn table for floor 10
    Then "skeleton_warrior" is in the spawn table

  Scenario: Skeleton Mage does not appear on floor 10
    Given the spawn table for floor 10
    Then "skeleton_mage" is not in the spawn table

  # ── Spawn table — floors 13–15 ───────────────────────────────────────────────

  Scenario: Skeleton Mage appears from floor 13
    Given the spawn table for floor 13
    Then "skeleton_mage" is in the spawn table

  Scenario: Skeleton Warrior still appears on floor 13
    Given the spawn table for floor 13
    Then "skeleton_warrior" is in the spawn table

  # ── Spawn table — floors 16+ ─────────────────────────────────────────────────

  Scenario: Skeleton Mage does not appear on floor 16
    Given the spawn table for floor 16
    Then "skeleton_mage" is not in the spawn table

  Scenario: Skeleton Warrior does not appear on floor 16
    Given the spawn table for floor 16
    Then "skeleton_warrior" is not in the spawn table
