Feature: Run Stats Tracking

  The game tracks per-save-slot statistics about the current run.
  Stats recorded: deepest floor reached, kills per enemy type, consumables
  used per item id, walls broken, gold gained, and gold spent in shops.
  All stats survive save/load cycles.

  # ── Initial state ────────────────────────────────────────────────────────────

  Scenario: Fresh player has all stats at zero
    Given a fresh player
    Then the run stats deepest floor is 1
    And the run stats kills map is empty
    And the run stats consumables map is empty
    And the run stats walls broken is 0
    And the run stats gold gained is 0
    And the run stats gold spent is 0

  # ── Deepest floor ─────────────────────────────────────────────────────────────

  Scenario: Descending to a deeper floor updates deepest floor
    Given a fresh player
    When the player records floor 5
    Then the run stats deepest floor is 5

  Scenario: Ascending does not reduce deepest floor
    Given a fresh player
    When the player records floor 5
    And the player records floor 3
    Then the run stats deepest floor is 5

  Scenario: Recording the same floor again does not change deepest floor
    Given a fresh player
    When the player records floor 4
    And the player records floor 4
    Then the run stats deepest floor is 4

  # ── Kill tracking ─────────────────────────────────────────────────────────────

  Scenario: Killing an enemy increments that enemy type's kill count
    Given a fresh player
    When the player records a kill of type "goblin"
    Then the run stats kill count for "goblin" is 1

  Scenario: Killing multiple enemies of the same type accumulates the count
    Given a fresh player
    When the player records a kill of type "skeleton"
    And the player records a kill of type "skeleton"
    And the player records a kill of type "skeleton"
    Then the run stats kill count for "skeleton" is 3

  Scenario: Kills of different enemy types are tracked independently
    Given a fresh player
    When the player records a kill of type "goblin"
    And the player records a kill of type "orc"
    Then the run stats kill count for "goblin" is 1
    And the run stats kill count for "orc" is 1

  # ── Consumable tracking ───────────────────────────────────────────────────────

  Scenario: Using a consumable increments that item id's usage count
    Given a fresh player
    When the player records use of consumable "health_potion"
    Then the run stats usage count for "health_potion" is 1

  Scenario: Using the same consumable multiple times accumulates the count
    Given a fresh player
    When the player records use of consumable "health_potion"
    And the player records use of consumable "health_potion"
    Then the run stats usage count for "health_potion" is 2

  Scenario: Different consumables are tracked independently
    Given a fresh player
    When the player records use of consumable "health_potion"
    And the player records use of consumable "antidote"
    Then the run stats usage count for "health_potion" is 1
    And the run stats usage count for "antidote" is 1

  # ── Wall breaking ─────────────────────────────────────────────────────────────

  Scenario: Breaking a wall increments walls broken
    Given a fresh player
    When the player records a wall broken
    Then the run stats walls broken is 1

  Scenario: Breaking multiple walls accumulates the count
    Given a fresh player
    When the player records a wall broken
    And the player records a wall broken
    And the player records a wall broken
    Then the run stats walls broken is 3

  # ── Gold tracking ─────────────────────────────────────────────────────────────

  Scenario: Gaining gold increments gold gained
    Given a fresh player
    When the player records 50 gold gained
    Then the run stats gold gained is 50

  Scenario: Multiple gold gains accumulate
    Given a fresh player
    When the player records 30 gold gained
    And the player records 20 gold gained
    Then the run stats gold gained is 50

  Scenario: Spending gold increments gold spent
    Given a fresh player
    When the player records 40 gold spent
    Then the run stats gold spent is 40

  Scenario: Multiple gold spends accumulate
    Given a fresh player
    When the player records 25 gold spent
    And the player records 15 gold spent
    Then the run stats gold spent is 40

  Scenario: Gold gained and gold spent are tracked independently
    Given a fresh player
    When the player records 100 gold gained
    And the player records 60 gold spent
    Then the run stats gold gained is 100
    And the run stats gold spent is 60

  # ── Save / load persistence ───────────────────────────────────────────────────

  Scenario: Run stats are persisted through a save/load cycle
    Given an empty save storage
    And a fresh player with run stats: floor 7, 3 goblin kills, 2 health_potions used, 1 wall broken, 80 gold gained, 30 gold spent
    When the player is saved to slot 0 on floor 7
    And the save is loaded from slot 0
    Then the loaded run stats deepest floor is 7
    And the loaded run stats kill count for "goblin" is 3
    And the loaded run stats usage count for "health_potion" is 2
    And the loaded run stats walls broken is 1
    And the loaded run stats gold gained is 80
    And the loaded run stats gold spent is 30

  Scenario: Missing run stats in an old save defaults to zeroes on load
    Given an empty save storage
    And a legacy save in slot 0 with no runStats field
    When the save is loaded from slot 0
    Then the loaded run stats deepest floor is 1
    And the loaded run stats walls broken is 0
    And the loaded run stats gold gained is 0
