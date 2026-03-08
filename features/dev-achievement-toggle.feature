Feature: Dev mode achievement toggle
  As a developer I want to force-complete or reset any achievement
  so that I can test achievement-related behaviour without playing through the game.

  Scenario: Dev toggle force-completes an incomplete achievement
    Given the achievement system is initialised
    When the dev toggle completes the "goblin_killer" achievement
    Then the "goblin_killer" progress should be marked as completed

  Scenario: Dev toggle uncompletes a completed achievement and resets progress
    Given the achievement system is initialised
    When the player kills 10 goblins
    And the dev toggle uncompletes the "goblin_killer" achievement
    Then the "goblin_killer" progress should not be marked as completed
    And the "goblin_killer" progress count should be 0

  Scenario: Dev toggle can recomplete an achievement after uncompleting it
    Given the achievement system is initialised
    When the player kills 10 goblins
    And the dev toggle uncompletes the "goblin_killer" achievement
    And the dev toggle completes the "goblin_killer" achievement
    Then the "goblin_killer" progress should be marked as completed
