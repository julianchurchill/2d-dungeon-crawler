Feature: Player Movement

  Scenario: Walking into a locked door tile returns a locked_door action
    Given a player at position 5, 5
    And a floor tile at position 5, 5
    And a locked door tile at position 6, 5
    When the player moves right
    Then the move result should be "locked_door"
    And the player position should remain 5, 5

  Scenario: Player moves to an adjacent walkable floor tile
    Given a player at position 5, 5
    And a floor tile at position 6, 5
    When the player moves right
    Then the player position should be 6, 5
    And the move result should be "moved"

  Scenario: Player cannot move through a wall
    Given a player at position 5, 5
    And a wall at position 6, 5
    When the player moves right
    Then the player position should remain 5, 5
    And the move result should be "blocked"

  Scenario: Moving into an enemy triggers combat instead of movement
    Given a player at position 5, 5
    And an enemy at position 6, 5
    When the player moves right
    Then the move result should be "attacked"
    And the attack target should be the enemy

  Scenario: Moving onto stairs triggers floor descent
    Given a player at position 5, 5
    And stairs at position 6, 5
    When the player moves right
    Then the player position should be 6, 5
    And the move result should be "stairs"

  Scenario: Moving onto up-stairs triggers floor ascent
    Given a player at position 5, 5
    And up-stairs at position 6, 5
    When the player moves right
    Then the player position should be 6, 5
    And the move result should be "stairs_up"

  Scenario: Moving into a door tile opens a shop without moving the player
    Given a player at position 5, 5
    And a door at position 6, 5
    When the player moves right
    Then the player position should remain 5, 5
    And the move result should be "shop"
