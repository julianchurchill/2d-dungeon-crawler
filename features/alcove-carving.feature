Feature: Alcove Carving

  When a breakable wall is destroyed, a small cave alcove is carved into
  the wall mass beyond it. The alcove reveals 1–3 new floor tiles directly
  ahead of the break (in the direction the player moved), giving the area
  a rough cave-pocket feel. The walls bordering this newly opened space
  each have a small chance of also being breakable, rewarding players who
  explore aggressively with their pick axe.

  # ── Forward tile ────────────────────────────────────────────────────────────

  Scenario: Breaking a wall carves a floor tile directly ahead
    Given a 20x20 map filled with walls except floor at 5, 5
    When the alcove is carved at 6, 5 moving in direction 1, 0 with always-carve RNG
    Then the tile at 7, 5 is FLOOR

  Scenario: No alcove tiles are carved when RNG prevents it
    Given a 20x20 map filled with walls except floor at 5, 5
    When the alcove is carved at 6, 5 moving in direction 1, 0 with never-carve RNG
    Then the tile at 7, 5 is WALL

  # ── Diagonal tiles ──────────────────────────────────────────────────────────

  Scenario: Breaking a wall may carve diagonal alcove tiles
    Given a 20x20 map filled with walls except floor at 5, 5
    When the alcove is carved at 6, 5 moving in direction 1, 0 with always-carve RNG
    Then the tile at 7, 4 is FLOOR
    And the tile at 7, 6 is FLOOR

  # ── Breakable neighbours ────────────────────────────────────────────────────

  Scenario: Walls bordering the new alcove floor may become breakable
    Given a 20x20 map filled with walls except floor at 5, 5
    When the alcove is carved at 6, 5 moving in direction 1, 0 with always-carve RNG
    Then at least one tile adjacent to the alcove is BREAKABLE_WALL

  Scenario: Only WALL tiles are converted to BREAKABLE_WALL
    Given a 20x20 map filled with walls except floor at 5, 5
    And a FLOOR tile at 8, 5
    When the alcove is carved at 6, 5 moving in direction 1, 0 with always-carve RNG
    Then the tile at 8, 5 is still FLOOR

  # ── Out-of-bounds safety ────────────────────────────────────────────────────

  Scenario: Alcove carving near a map edge does not throw
    Given a 20x20 map filled with walls except floor at 5, 5
    When the alcove is carved at 19, 5 moving in direction 1, 0 with always-carve RNG
    Then no error is thrown
