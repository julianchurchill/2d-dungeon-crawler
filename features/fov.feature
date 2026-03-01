Feature: Field of View

  Scenario: The player's own tile is always visible
    Given an open dungeon map
    When FOV is computed from position 10, 10 with radius 8
    Then tile 10, 10 should be visible

  Scenario: Tiles within radius are visible when line of sight is clear
    Given an open dungeon map
    When FOV is computed from position 10, 10 with radius 8
    Then tile 10, 11 should be visible
    And tile 10, 12 should be visible
    And tile 12, 10 should be visible

  Scenario: Tiles beyond the radius are not visible
    Given an open dungeon map
    When FOV is computed from position 10, 10 with radius 3
    Then tile 10, 20 should not be visible
    And tile 20, 10 should not be visible

  Scenario: A wall blocks line of sight to tiles behind it
    Given an open dungeon map with a wall at 10, 13
    When FOV is computed from position 10, 10 with radius 8
    Then tile 10, 15 should not be visible

  Scenario: Previously visible tiles become explored after the player moves away
    Given an open dungeon map
    And FOV has been computed from position 10, 10 with radius 8
    When FOV is computed from position 30, 10 with radius 3
    Then tile 10, 10 should be explored but not currently visible
