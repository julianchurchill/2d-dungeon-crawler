Feature: Export and Import Save as Encoded String

  A player can export any occupied save slot as a compact encoded string and
  copy it to their clipboard.  The same string can later be pasted back to
  restore that save into any slot, enabling cross-device transfers and manual
  backups.

  Scenario: Exporting an empty slot returns null
    Given an empty save storage
    Then exporting slot 0 should return null

  Scenario: Exporting an occupied slot returns a non-empty string
    Given an empty save storage
    And a player on floor 3 with 25 of 30 HP and 50 gold
    When the game is saved to slot 0
    Then exporting slot 0 should return a non-empty string

  Scenario: Importing an invalid string returns false
    Given an empty save storage
    Then importing "not-valid-data" into slot 0 should return false

  Scenario: Importing an empty string returns false
    Given an empty save storage
    Then importing "" into slot 0 should return false

  Scenario: Exported string round-trips back to the same floor
    Given an empty save storage
    And a player on floor 5 with 20 of 30 HP and 100 gold
    When the game is saved to slot 0
    And the save from slot 0 is exported and imported into slot 1
    Then loading slot 1 should return floor 5

  Scenario: Import into a different slot does not affect the original
    Given an empty save storage
    And a player on floor 2 with 30 of 30 HP and 0 gold
    When the game is saved to slot 0
    And the save from slot 0 is exported and imported into slot 1
    Then slot 0 should have a save

  Scenario: Importing overwrites existing data in the target slot
    Given an empty save storage
    And a player on floor 1 with 30 of 30 HP and 0 gold
    When the game is saved to slot 4
    And the game is saved to slot 2
    And the save from slot 4 is exported and imported into slot 2
    Then loading slot 2 should return floor 1
