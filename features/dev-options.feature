Feature: Developer options
  As a developer I want to configure starting conditions so that I can
  test deeper floors and higher character levels without playing through
  earlier content.

  Background:
    Given developer options are reset to defaults

  Scenario: Default options are floor 1, level 1, no items
    Then the start floor should be 1
    And the start level should be 1
    And the start items should be empty

  Scenario: Start floor can be set
    When the start floor is set to 3
    Then the start floor should be 3

  Scenario: Start level can be set
    When the start level is set to 5
    Then the start level should be 5

  Scenario: Items can be added to starting inventory
    When a "SWORD" is added to the starting items
    And a "HEALTH_POTION" is added to the starting items
    Then the starting items should contain "SWORD"
    And the starting items should contain "HEALTH_POTION"

  Scenario: Reset restores all defaults
    Given the start floor is set to 4
    And the start level is set to 7
    And a "SWORD" is added to the starting items
    When developer options are reset
    Then the start floor should be 1
    And the start level should be 1
    And the start items should be empty

  Scenario: applyToGame with defaults does not change player or floor
    Given a new player
    And a new floor manager
    When developer options are applied to the game
    Then the player should be level 1
    And the floor manager should be on floor 1
    And the player inventory should be empty

  Scenario: applyToGame levels up player to the configured level
    Given a new player
    And a new floor manager
    And the start level is set to 3
    When developer options are applied to the game
    Then the player should be level 3
    And the player attack should be 7
    And the player max HP should be 40

  Scenario: applyToGame sets the floor manager to the configured floor
    Given a new player
    And a new floor manager
    And the start floor is set to 5
    When developer options are applied to the game
    Then the floor manager should be on floor 5

  Scenario: applyToGame adds configured items to the player inventory
    Given a new player
    And a new floor manager
    And a "SWORD" is added to the starting items
    When developer options are applied to the game
    Then the player inventory should contain an item named "Short Sword"
