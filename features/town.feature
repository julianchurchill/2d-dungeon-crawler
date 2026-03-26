Feature: Town Level

  The town is a special level at floor 0. It is the starting place for every
  new game, has a fixed non-random layout, and combat is disabled there.

  Scenario: A new game starts at floor 0 (the town)
    Given a new FloorManager
    Then the current floor is 0

  Scenario: Floor 0 is identified as the town
    Given a new FloorManager
    Then the floor is the town

  Scenario: Descending from the town enters floor 1
    Given a new FloorManager
    When the player descends
    Then the current floor is 1

  Scenario: Descending from the town leaves the town
    Given a new FloorManager
    When the player descends
    Then the floor is not the town

  Scenario: The town has a fixed non-random layout
    Given the town is generated
    When the town is generated again
    Then both town layouts are identical

  Scenario: The town map contains floor tiles
    Given the town is generated
    Then the town map contains floor tiles

  Scenario: The town map contains stairs leading down to the dungeon
    Given the town is generated
    Then the town map contains stairs leading down

  Scenario: The town start position is on a walkable tile
    Given the town is generated
    Then the town start position is on a walkable tile

  Scenario: FloorManager generates the town map at floor 0
    Given a new FloorManager
    When the floor is generated
    Then the generated floor map contains floor tiles
    And the generated floor map contains stairs leading down
    And the generated floor start position is on a walkable tile
