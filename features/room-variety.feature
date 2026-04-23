Feature: Room shape variety in dungeon generation
  Normal dungeon floors contain rooms in a variety of shapes — rectangle,
  cross, L-shape, and chamfered — to create more tactically interesting
  combat spaces.  Large rectangular rooms may also have internal wall pillars
  as obstacles.

  # ── Cross rooms ──────────────────────────────────────────────────────────

  Scenario: A cross-shaped room has a walkable centre
    When a cross room is carved into a blank 30x30 map at x 5 y 5 with size 11 x 11
    Then the tile at x 10 y 10 should be a floor tile

  Scenario: A cross-shaped room has empty corners
    When a cross room is carved into a blank 30x30 map at x 5 y 5 with size 11 x 11
    Then the tile at x 5 y 5 should not be a floor tile
    And the tile at x 15 y 5 should not be a floor tile
    And the tile at x 5 y 15 should not be a floor tile
    And the tile at x 15 y 15 should not be a floor tile

  # ── Chamfered rooms ───────────────────────────────────────────────────────

  Scenario: A chamfered room has a walkable centre
    When a chamfered room is carved into a blank 30x30 map at x 5 y 5 with size 11 x 11
    Then the tile at x 10 y 10 should be a floor tile

  Scenario: A chamfered room has clipped corners
    When a chamfered room is carved into a blank 30x30 map at x 5 y 5 with size 11 x 11
    Then the tile at x 5 y 5 should not be a floor tile
    And the tile at x 15 y 5 should not be a floor tile
    And the tile at x 5 y 15 should not be a floor tile
    And the tile at x 15 y 15 should not be a floor tile

  # ── L-shaped rooms ────────────────────────────────────────────────────────

  Scenario: An L-shaped room has a walkable centre — orientation 0
    When an L-shaped room orientation 0 is carved into a blank 30x30 map at x 5 y 5 with size 10 x 10
    Then the tile at x 10 y 10 should be a floor tile

  Scenario: An L-shaped room has one excluded corner — orientation 0
    When an L-shaped room orientation 0 is carved into a blank 30x30 map at x 5 y 5 with size 10 x 10
    Then the tile at x 14 y 5 should not be a floor tile

  Scenario: An L-shaped room has a walkable centre — orientation 2 size 8x8
    When an L-shaped room orientation 2 is carved into a blank 30x30 map at x 5 y 5 with size 8 x 8
    Then the tile at x 9 y 9 should be a floor tile

  Scenario: An L-shaped room has a walkable centre — orientation 2 size 9x8
    When an L-shaped room orientation 2 is carved into a blank 30x30 map at x 5 y 5 with size 9 x 8
    Then the tile at x 9 y 9 should be a floor tile

  # ── Rectangular rooms with pillars ────────────────────────────────────────

  Scenario: A large rectangular room has internal wall pillars
    When a rectangular room with pillars is carved into a blank 30x30 map at x 2 y 2 with size 10 x 10
    Then the tile at x 4 y 4 should not be a floor tile
    And the tile at x 9 y 4 should not be a floor tile
    And the tile at x 4 y 9 should not be a floor tile
    And the tile at x 9 y 9 should not be a floor tile

  # ── Dungeon-level invariants ──────────────────────────────────────────────

  Scenario: Dungeons across many seeds all have reachable stairs
    Then dungeons with seeds 1 to 20 should all have stairs reachable from start

  Scenario: Dungeons across many seeds all have walkable start positions
    Then dungeons with seeds 1 to 20 should all have walkable start positions
