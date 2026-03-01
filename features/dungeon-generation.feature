Feature: Dungeon Generation

  Scenario: A generated dungeon contains walkable floor tiles
    When a dungeon is generated with seed 12345
    Then the map should contain floor tiles

  Scenario: A generated dungeon contains stairs leading down
    When a dungeon is generated with seed 12345
    Then the map should contain stairs leading down

  Scenario: The player start position is on a walkable tile
    When a dungeon is generated with seed 12345
    Then the start position should be on a walkable tile

  Scenario: Dungeon generation is deterministic with the same seed
    Given a dungeon generated with seed 99999
    When another dungeon is generated with seed 99999
    Then both maps should be identical

  Scenario: Different seeds produce different dungeons
    Given a dungeon generated with seed 11111
    When another dungeon is generated with seed 22222
    Then the maps should be different

  Scenario: The stairs are reachable from the player start position
    When a dungeon is generated with seed 12345
    Then the stairs should be reachable from the start position
