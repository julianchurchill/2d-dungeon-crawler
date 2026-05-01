Feature: Multiple Save Slots

  The game supports five independent save slots. Each slot stores full player
  and floor state independently. A slot summary — floor reached, player level,
  and save timestamp — is available for the slot selection screen.

  Scenario: Saving to one slot does not affect another
    Given an empty save storage
    And a player on floor 3 with 25 of 30 HP and 50 gold
    When the game is saved to slot 0
    Then slot 0 should have a save
    And slot 1 should not have a save

  Scenario: Each slot stores independent floor data
    Given an empty save storage
    And a player on floor 2 with 30 of 30 HP and 0 gold
    When the game is saved to slot 1
    Then loading slot 1 should return floor 2

  Scenario: Deleting one slot does not affect others
    Given an empty save storage
    And a player on floor 1 with 30 of 30 HP and 0 gold
    When the game is saved to slot 0
    And the game is saved to slot 2
    And slot 0 is deleted
    Then slot 0 should not have a save
    And slot 2 should have a save

  Scenario: Save data includes a savedAt timestamp
    Given an empty save storage
    And a player on floor 1 with 30 of 30 HP and 0 gold
    When the game is saved to slot 0
    Then the save in slot 0 should include a savedAt timestamp

  Scenario: listSaves returns one entry per slot
    Given an empty save storage
    And a player on floor 4 with 30 of 30 HP and 0 gold
    When the game is saved to slot 2
    Then listSaves should return 5 entries

  Scenario: Populated slot entry includes correct floor and is not empty
    Given an empty save storage
    And a player on floor 4 with 30 of 30 HP and 0 gold
    When the game is saved to slot 2
    Then the entry for slot 2 should not be empty
    And the entry for slot 2 should have floor 4

  Scenario: Unpopulated slot entry is empty
    Given an empty save storage
    And a player on floor 4 with 30 of 30 HP and 0 gold
    When the game is saved to slot 2
    Then the entry for slot 0 should be empty

  Scenario: Slot summary includes player level
    Given an empty save storage
    And a player on floor 1 with 30 of 30 HP and 0 gold
    When the game is saved to slot 3
    Then the entry for slot 3 should include level 1
