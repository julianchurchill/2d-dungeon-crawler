Feature: Unique rooms in dungeon generation
  Once per game a normal dungeon floor can contain a unique named room such as
  "The Dark Armoury" or "The Necropolis Library".  When the player enters a
  floor that contains one they are alerted by a message.  Each unique room
  contains special items, enemies, or an NPC, and can only appear once per
  game.  They never appear on challenge floors or in the town.

  # ── Registry — tracking seen rooms ─────────────────────────────────────────

  Scenario: A freshly created registry has no seen rooms
    Given a fresh unique room registry
    Then the registry should not record "dark_armoury" as seen

  Scenario: Marking a room as seen records it in the registry
    Given a fresh unique room registry
    When "dark_armoury" is marked as seen in the registry
    Then the registry should record "dark_armoury" as seen

  Scenario: Resetting the registry clears all seen rooms
    Given a fresh unique room registry with "dark_armoury" marked as seen
    When the registry is reset
    Then the registry should not record "dark_armoury" as seen

  # ── Eligibility checks ───────────────────────────────────────────────────

  Scenario: A room is eligible when the floor meets its threshold and it is unseen
    Given a fresh unique room registry
    When eligible unique rooms are fetched for floor 8
    Then the room "dark_armoury" should be eligible

  Scenario: A room is not eligible below its minimum floor
    Given a fresh unique room registry
    When eligible unique rooms are fetched for floor 2
    Then the room "dark_armoury" should not be eligible

  Scenario: An already-seen room is not eligible
    Given a fresh unique room registry with "dark_armoury" marked as seen
    When eligible unique rooms are fetched for floor 10
    Then the room "dark_armoury" should not be eligible

  # ── Dev force option ──────────────────────────────────────────────────────

  Scenario: Forcing a room bypasses its minimum floor threshold
    Given a fresh unique room registry
    When eligible unique rooms are fetched for floor 1 with force "dark_armoury"
    Then the room "dark_armoury" should be eligible

  Scenario: Forcing a room bypasses the already-seen check
    Given a fresh unique room registry with "dark_armoury" marked as seen
    When eligible unique rooms are fetched for floor 10 with force "dark_armoury"
    Then the room "dark_armoury" should be eligible

  # ── Room definitions ──────────────────────────────────────────────────────

  Scenario: The Dark Armoury has items and a positive minimum floor
    Then the "dark_armoury" definition should have at least 1 item
    And the "dark_armoury" definition should have a minimum floor above 0

  Scenario: The Dark Armoury contains the Night Cloak
    Then the "dark_armoury" definition should include item "NIGHT_CLOAK"

  Scenario: The Dark Armoury contains the Null Scimitar
    Then the "dark_armoury" definition should include item "NULL_SCIMITAR"

  Scenario: The Dark Armoury guardian is a champion troll
    Then the "dark_armoury" definition should have a champion "troll" guardian

  Scenario: The Necropolis Library has items and a positive minimum floor
    Then the "necropolis_library" definition should have at least 1 item
    And the "necropolis_library" definition should have a minimum floor above 0

  Scenario: The Dark Armoury has a named entry message
    Then the "dark_armoury" definition should have a non-empty entry message

  Scenario: The Necropolis Library has a named entry message
    Then the "necropolis_library" definition should have a non-empty entry message

  # ── Decoration placement — corridor avoidance ────────────────────────────

  Scenario: Edge row decorations skip a tile that is directly adjacent to a corridor
    Given a 10x10 dungeon map with room at x 1 y 1 width 8 height 8
    And a corridor floor tile at x 0 y 3 entering the room from the west
    When BOOKCASE edge_rows decorations with spacing 3 are placed for the room
    Then no decoration should exist at x 1 y 3

  Scenario: Inner corner decorations skip a tile when the corridor enters the adjacent doorway
    Given a 10x10 dungeon map with room at x 1 y 1 width 8 height 8
    And a corridor floor tile at x 0 y 2 entering the room from the west
    When WEAPON_MOUNT inner_corners decorations are placed for the room
    Then no decoration should exist at x 2 y 2

  # ── Room decoration tile types ───────────────────────────────────────────

  Scenario: WEAPON_MOUNT tile type is defined and distinct from WALL
    Then the WEAPON_MOUNT tile type should be a non-zero integer
    And the WEAPON_MOUNT tile type should differ from the WALL tile type

  Scenario: BOOKCASE tile type is defined and distinct from WALL
    Then the BOOKCASE tile type should be a non-zero integer
    And the BOOKCASE tile type should differ from the WALL tile type

  Scenario: Weapon mount tiles are non-walkable
    Given a dungeon map with a WEAPON_MOUNT tile at x 5 y 5
    Then the tile at x 5 y 5 should not be walkable

  Scenario: Bookcase tiles are non-walkable
    Given a dungeon map with a BOOKCASE tile at x 5 y 5
    Then the tile at x 5 y 5 should not be walkable

  Scenario: Weapon mount tiles block line of sight
    Given a dungeon map with a WEAPON_MOUNT tile at x 5 y 5
    Then the tile at x 5 y 5 should be opaque

  Scenario: Bookcase tiles block line of sight
    Given a dungeon map with a BOOKCASE tile at x 5 y 5
    Then the tile at x 5 y 5 should be opaque

  Scenario: The Dark Armoury definition includes weapon mount decorations
    Then the "dark_armoury" definition should specify WEAPON_MOUNT decorations

  Scenario: The Necropolis Library definition includes bookcase decorations
    Then the "necropolis_library" definition should specify BOOKCASE decorations

  # ── Entry message — triggers on room entry, not level load ──────────────

  Scenario: No entry messages when player is outside the unique room
    Given a unique room entry tracker with room at x 5 y 5 width 4 height 4 for "dark_armoury"
    When the player is checked at x 3 y 5
    Then no entry messages should be returned

  Scenario: Entry messages are returned when player first steps inside the unique room
    Given a unique room entry tracker with room at x 5 y 5 width 4 height 4 for "dark_armoury"
    When the player is checked at x 5 y 5
    Then entry messages should be returned

  Scenario: Only the room flavour text is returned on entry not the floor-level hint
    Given a unique room entry tracker with room at x 5 y 5 width 4 height 4 for "dark_armoury"
    When the player is checked at x 5 y 5
    Then exactly 1 entry message should be returned

  Scenario: The room entry message includes the unique room name
    Given a unique room entry tracker with room at x 5 y 5 width 4 height 4 for "dark_armoury"
    When the player is checked at x 5 y 5
    Then the entry message should contain "The Dark Armoury"

  Scenario: Entry messages are only returned once per floor
    Given a unique room entry tracker with room at x 5 y 5 width 4 height 4 for "dark_armoury"
    When the player is checked at x 5 y 5
    And the player is checked at x 6 y 5
    Then no entry messages should be returned

  # ── Room-specific tile textures ──────────────────────────────────────────

  Scenario: The Dark Armoury has a unique floor texture key
    Then the "dark_armoury" definition should have a non-empty floor key
    And the "dark_armoury" floor key should differ from the default floor key

  Scenario: The Dark Armoury has a unique wall texture key
    Then the "dark_armoury" definition should have a non-empty wall key
    And the "dark_armoury" wall key should differ from the default wall key

  Scenario: The Necropolis Library has a unique floor texture key
    Then the "necropolis_library" definition should have a non-empty floor key
    And the "necropolis_library" floor key should differ from the default floor key

  Scenario: The Necropolis Library has a unique wall texture key
    Then the "necropolis_library" definition should have a non-empty wall key
    And the "necropolis_library" wall key should differ from the default wall key
