Feature: Pick Axe

  The pick axe is a weak melee weapon with a unique secondary purpose: when
  equipped, the player can destroy Breakable Walls by moving into them.
  Breakable Walls look identical to regular walls but are identified as
  "Rocky Stone Wall" when examined with the Look feature, hinting that they
  can be broken.

  # ── Item definition ─────────────────────────────────────────────────────────

  Scenario: Pick axe item type is defined as a weapon
    Given the pick axe item type
    Then it is a weapon

  Scenario: Pick axe has the canBreakWalls property
    Given the pick axe item type
    Then it has the canBreakWalls property

  Scenario: Pick axe is a weak weapon
    Given the pick axe item type
    Then its attack bonus is at most 3

  # ── BREAKABLE_WALL tile ──────────────────────────────────────────────────────

  Scenario: BREAKABLE_WALL tile type is defined
    Then the BREAKABLE_WALL tile value is defined

  Scenario: BREAKABLE_WALL tile is not walkable
    Given a dungeon map with a BREAKABLE_WALL tile at position 3 3
    Then the tile at 3 3 is not walkable

  Scenario: BREAKABLE_WALL tile is opaque
    Given a dungeon map with a BREAKABLE_WALL tile at position 3 3
    Then the tile at 3 3 is opaque

  Scenario: BREAKABLE_WALL look label is Rocky Stone Wall
    Then the look label for BREAKABLE_WALL is 'Rocky Stone Wall'

  # ── Wall breaking ─────────────────────────────────────────────────────────────

  Scenario: Player with pick axe equipped can break a breakable wall
    Given a player at position 3, 3
    And a BREAKABLE_WALL at position 4, 3
    And a pick axe is equipped
    When the player moves right
    Then the move result should be "break_wall"

  Scenario: Player without a pick axe is blocked by a breakable wall
    Given a player at position 3, 3
    And a BREAKABLE_WALL at position 4, 3
    When the player moves right
    Then the move result should be "blocked"
