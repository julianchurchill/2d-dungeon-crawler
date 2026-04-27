Feature: Save Game

  The game state is persisted to localStorage so progress survives a page
  refresh.  Starting a new game discards any existing save.  Continuing
  restores the player to the floor and exact state they left on.

  Scenario: hasSave returns false when storage is empty
    Given an empty save storage
    Then hasSave should return false

  Scenario: hasSave returns true after saving
    Given an empty save storage
    And a player on floor 2 with 25 of 30 HP and 50 gold
    When the game is saved
    Then hasSave should return true

  Scenario: Saving persists the floor number
    Given an empty save storage
    And a player on floor 3 with 30 of 30 HP and 0 gold
    When the game is saved
    Then the loaded save should have floor 3

  Scenario: Saving persists player stats
    Given an empty save storage
    And a player on floor 1 with 25 of 30 HP and 50 gold
    When the game is saved
    Then the loaded save should have hp 25 and maxHp 30 and gold 50

  Scenario: Saving persists inventory items
    Given an empty save storage
    And a player on floor 1 with 30 of 30 HP and 0 gold
    And the player has 2 of item "health_potion" in their inventory
    When the game is saved
    Then the loaded save should include 2 of item "health_potion" in inventory

  Scenario: Saving persists the equipped weapon
    Given an empty save storage
    And a player on floor 1 with 30 of 30 HP and 0 gold
    And the player has item "sword" equipped as weapon
    When the game is saved
    Then the loaded save should have "sword" equipped as weapon

  Scenario: Deleting a save makes hasSave return false
    Given an empty save storage
    And a player on floor 1 with 30 of 30 HP and 0 gold
    When the game is saved
    And the save is deleted
    Then hasSave should return false

  Scenario: Saving persists active skill upgrade state
    Given an empty save storage
    And a player on floor 1 with 30 of 30 HP and 0 gold
    And the player has an active skill "lucky_strike" with critChance 0.05
    When the game is saved
    Then the loaded save should have an active skill "lucky_strike" with critChance 0.05
