Feature: Trash Piles in Dungeon Rooms

  Some dungeon rooms are littered with random trash piles.
  There are three visual variants. Trash piles are non-walkable
  but transparent (they do not block line of sight).
  They are never placed adjacent to corridor entries.

  # ── Tile properties ─────────────────────────────────────────────────────────

  Scenario: Trash pile variant 1 is non-walkable
    Given a dungeon map with trash pile variant 1 at position 5,5
    Then position 5,5 is not walkable

  Scenario: Trash pile variant 2 is non-walkable
    Given a dungeon map with trash pile variant 2 at position 5,5
    Then position 5,5 is not walkable

  Scenario: Trash pile variant 3 is non-walkable
    Given a dungeon map with trash pile variant 3 at position 5,5
    Then position 5,5 is not walkable

  Scenario: Trash pile tiles are not opaque
    Given a dungeon map with trash pile variant 1 at position 5,5
    Then position 5,5 is not opaque

  # ── Placement rules ──────────────────────────────────────────────────────────

  Scenario: Trash piles are only placed on plain floor tiles
    Given a room from 2,2 to 8,8 on a dungeon map
    When the trash pile placer places piles in the room
    Then every trash pile was on a floor tile before placement

  Scenario: Trash piles are never placed adjacent to a corridor entry
    Given a room from 2,2 to 8,8 on a dungeon map with a corridor at x=8 y=5
    When the trash pile placer places piles in the room
    Then no trash pile is adjacent to the corridor entry at x=8 y=5

  Scenario: Trash pile placer uses all three tile variants
    Given a large room from 2,2 to 20,20 on a dungeon map
    When the trash pile placer places many piles in the room
    Then all three trash pile variants were placed
