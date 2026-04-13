Feature: Tileset Manager

  The tileset manager tracks which visual tileset is active and persists
  the choice across sessions using storage.

  Scenario: Default tileset is classic
    Given a fresh tileset manager
    Then the active tileset should be 'classic'

  Scenario: Tileset can be changed to modern
    Given a fresh tileset manager
    When the tileset is changed to 'modern'
    Then the active tileset should be 'modern'

  Scenario: Tileset selection is persisted in storage
    Given a fresh tileset manager
    When the tileset is changed to 'modern'
    And a new tileset manager is created from the same storage
    Then the active tileset should be 'modern'

  Scenario: Changing tileset back to classic is persisted
    Given a fresh tileset manager
    When the tileset is changed to 'modern'
    And the tileset is changed to 'classic'
    And a new tileset manager is created from the same storage
    Then the active tileset should be 'classic'

  Scenario: Tile key is prefixed with the classic tileset
    Given a fresh tileset manager
    Then the tile key for 'tile_floor' should be 'classic_tile_floor'

  Scenario: Tile key prefix changes when tileset is switched to modern
    Given a fresh tileset manager
    When the tileset is changed to 'modern'
    Then the tile key for 'tile_floor' should be 'modern_tile_floor'
