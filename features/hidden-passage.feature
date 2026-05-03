Feature: Hidden Passages

  Some breakable walls conceal a hidden passage leading to a small secret room
  that can only be reached by breaking the wall.  The first time a player comes
  within 8 tiles of such a wall the message log shows "You feel a draft nearby."
  Secret rooms always contain valuable items.  A dev option forces every eligible
  breakable wall to attempt a hidden room on the next floor.

  # ── Room carving ─────────────────────────────────────────────────────────────

  Scenario: HiddenPassagePlacer carves a room behind an eligible breakable wall
    Given a 30x20 map with a room floor from 2,2 to 6,6 and a breakable wall at 7,4
    When the hidden passage placer runs with always-succeed RNG
    Then floor tiles exist beyond the wall at 7,4 in the outward direction
    And the tile at 7,4 is HIDDEN_PASSAGE_WALL

  Scenario: No room is carved when the area beyond is already occupied
    Given a 30x20 map with a room floor from 2,2 to 6,6 and a breakable wall at 7,4
    And a FLOOR tile at 8,3
    When the hidden passage placer runs with always-succeed RNG
    Then the tile at 7,4 is still BREAKABLE_WALL

  Scenario: Chance roll prevents room placement
    Given a 30x20 map with a room floor from 2,2 to 6,6 and a breakable wall at 7,4
    When the hidden passage placer runs with never-succeed RNG
    Then the tile at 7,4 is still BREAKABLE_WALL

  Scenario: Force flag bypasses the chance roll
    Given a 30x20 map with a room floor from 2,2 to 6,6 and a breakable wall at 7,4
    When the hidden passage placer runs with force and never-succeed RNG
    Then the tile at 7,4 is HIDDEN_PASSAGE_WALL

  Scenario: Carved hidden room floor tiles are in-bounds
    Given a 30x20 map with a room floor from 2,2 to 6,6 and a breakable wall at 7,4
    When the hidden passage placer runs with always-succeed RNG
    Then all hidden room FLOOR tiles beyond x 7 are within the map bounds

  Scenario: Placer returns metadata for each hidden passage
    Given a 30x20 map with a room floor from 2,2 to 6,6 and a breakable wall at 7,4
    When the hidden passage placer runs with always-succeed RNG
    Then the result contains 1 passage with wallX 7 and wallY 4

  # ── Draft proximity ──────────────────────────────────────────────────────────

  Scenario: Player within 8 tiles triggers the draft message
    Given a dungeon map with a HIDDEN_PASSAGE_WALL at 10,5
    And the draft-shown set is empty
    When proximity is checked for a player at 4,5
    Then the draft message is triggered for the wall at 10,5

  Scenario: Player exactly 8 tiles away triggers the draft message
    Given a dungeon map with a HIDDEN_PASSAGE_WALL at 10,5
    And the draft-shown set is empty
    When proximity is checked for a player at 2,5
    Then the draft message is triggered for the wall at 10,5

  Scenario: Player more than 8 tiles away does not trigger the draft message
    Given a dungeon map with a HIDDEN_PASSAGE_WALL at 10,5
    And the draft-shown set is empty
    When proximity is checked for a player at 1,5
    Then no draft message is triggered

  Scenario: Draft message only fires once per wall per floor
    Given a dungeon map with a HIDDEN_PASSAGE_WALL at 10,5
    And the draft-shown set already contains wall 10,5
    When proximity is checked for a player at 4,5
    Then no draft message is triggered

  # ── Loot ────────────────────────────────────────────────────────────────────

  Scenario: Hidden room loot returns a valid item definition on any floor
    When hidden room loot is drawn for floor 1
    Then the result is a non-null item definition

  Scenario: Hidden room loot returns a valid item definition on a deep floor
    When hidden room loot is drawn for floor 25
    Then the result is a non-null item definition
