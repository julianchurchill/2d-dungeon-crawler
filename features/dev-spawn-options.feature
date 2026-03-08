Feature: Developer spawn options
  As a developer I want to configure enemy spawn behaviour so that I can
  test combat at specific enemy compositions and densities.

  Background:
    Given developer options are reset to defaults

  Scenario: Default spawn weights are null (use floor defaults)
    Then the dev spawn weights should be null

  Scenario: Default min enemies per room is null (use floor default)
    Then the dev min enemies per room should be null

  Scenario: Default max enemies per room is null (use floor default)
    Then the dev max enemies per room should be null

  Scenario: Spawn weights can be set
    When the dev spawn weights are set to goblin 3 orc 1 troll 0
    Then the dev spawn weights should be goblin 3 orc 1 troll 0

  Scenario: Min enemies per room can be set
    When the dev min enemies per room is set to 2
    Then the dev min enemies per room should be 2

  Scenario: Max enemies per room can be set
    When the dev max enemies per room is set to 6
    Then the dev max enemies per room should be 6

  Scenario: Reset clears spawn overrides back to null
    Given the dev spawn weights are set to goblin 2 orc 1 troll 1
    And the dev min enemies per room is set to 1
    And the dev max enemies per room is set to 5
    When developer options are reset
    Then the dev spawn weights should be null
    And the dev min enemies per room should be null
    And the dev max enemies per room should be null

  Scenario: Spawn config is valid when weights are null (floor defaults active)
    Then the spawn table config should be valid

  Scenario: Spawn config is valid when at least one weight is greater than zero
    When the dev spawn weights are set to goblin 0 orc 1 troll 0
    Then the spawn table config should be valid

  Scenario: Spawn config is invalid when all weights are zero
    When the dev spawn weights are set to goblin 0 orc 0 troll 0
    Then the spawn table config should be invalid

  Scenario: buildSpawnTableFromWeights converts weights to weighted array
    When a spawn table is built from goblin 2 orc 1 troll 0
    Then the spawn table should contain 2 goblins
    And the spawn table should contain 1 orc
    And the spawn table should contain 0 trolls
    And the spawn table should have 3 entries total
