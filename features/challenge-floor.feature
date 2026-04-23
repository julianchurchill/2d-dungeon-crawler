Feature: Challenge floors
  Every 5th dungeon floor (5, 10, 15, …) is a challenge floor.
  It has a fixed two-room layout: a small entry room with the up-staircase
  where the player spawns, and a large arena filled with enemies that must
  all be defeated before the down-staircase can be used.
  Only potions can spawn as items on challenge floors.

  # ── Floor identification ──────────────────────────────────────────────────

  Scenario: Floor 5 is a challenge floor
    Given a FloorManager on floor 5
    Then isChallengeFloor should return true

  Scenario: Floor 10 is a challenge floor
    Given a FloorManager on floor 10
    Then isChallengeFloor should return true

  Scenario: Floor 15 is a challenge floor
    Given a FloorManager on floor 15
    Then isChallengeFloor should return true

  Scenario: Floor 0 (town) is not a challenge floor
    Given a FloorManager on floor 0
    Then isChallengeFloor should return false

  Scenario: Floor 1 is not a challenge floor
    Given a FloorManager on floor 1
    Then isChallengeFloor should return false

  Scenario: Floor 6 is not a challenge floor
    Given a FloorManager on floor 6
    Then isChallengeFloor should return false

  # ── Challenge floor layout ────────────────────────────────────────────────

  Scenario: A challenge floor has exactly two rooms
    When a challenge floor is generated
    Then the challenge result should have exactly 2 rooms

  Scenario: A challenge floor is marked with isChallenge true
    When a challenge floor is generated
    Then the challenge result should have isChallenge set to true

  Scenario: A challenge floor has up-stairs
    When a challenge floor is generated
    Then the challenge map should contain stairs leading up

  Scenario: A challenge floor has down-stairs
    When a challenge floor is generated
    Then the challenge map should contain stairs leading down

  Scenario: The challenge floor start position is on a walkable tile
    When a challenge floor is generated
    Then the challenge start position should be on a walkable tile

  Scenario: The challenge floor up-stairs are reachable from the start
    When a challenge floor is generated
    Then the challenge up-stairs should be reachable from the start

  Scenario: The challenge floor down-stairs are reachable from the start
    When a challenge floor is generated
    Then the challenge down-stairs should be reachable from the start

  Scenario: FloorManager generates a challenge floor on floor 5
    Given a FloorManager on floor 5
    When the FloorManager generates the floor
    Then the result should have isChallenge set to true

  # ── Challenge floor loot ──────────────────────────────────────────────────

  Scenario: Challenge floor loot is always a consumable
    When challenge floor loot is drawn 20 times with a fixed RNG
    Then every drawn item should have type consumable

  Scenario: Challenge floor loot never includes weapons
    When challenge floor loot is drawn 20 times with a fixed RNG
    Then no drawn item should have type weapon

  Scenario: Challenge floor loot never includes armour
    When challenge floor loot is drawn 20 times with a fixed RNG
    Then no drawn item should have type armor
