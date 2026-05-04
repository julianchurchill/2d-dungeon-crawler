Feature: Dev-mode give item to player inventory
  As a developer I want to give any item directly to the player's inventory
  during a run so that I can test item interactions without relying on drops
  or shop purchases.

  Background:
    Given developer options are reset to defaults
    And a new player

  Scenario: Giving a known item adds it to the player inventory
    When the dev gives the player a "SWORD"
    Then the player inventory should contain an item named "Short Sword"

  Scenario: Giving a stackable item to a player who already has one increments the stack
    Given the dev gives the player a "HEALTH_POTION"
    When the dev gives the player a "HEALTH_POTION"
    Then the player inventory should contain 1 stack of "HEALTH_POTION"
    And the "HEALTH_POTION" stack count should be 2

  Scenario: Giving an item when inventory is full returns a failure result
    Given the player inventory is full
    When the dev gives the player a "SWORD"
    Then the dev give item result should be false

  Scenario: Giving an unknown item key does nothing and returns a failure result
    When the dev gives the player a "NOT_A_REAL_ITEM"
    Then the dev give item result should be false
    And the player inventory should be empty
