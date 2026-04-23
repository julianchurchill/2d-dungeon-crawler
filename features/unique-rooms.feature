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

  Scenario: The Necropolis Library has items and a positive minimum floor
    Then the "necropolis_library" definition should have at least 1 item
    And the "necropolis_library" definition should have a minimum floor above 0

  Scenario: The Dark Armoury has a named entry message
    Then the "dark_armoury" definition should have a non-empty entry message

  Scenario: The Necropolis Library has a named entry message
    Then the "necropolis_library" definition should have a non-empty entry message

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
