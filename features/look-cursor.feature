Feature: Look Cursor

  On non-touch devices the player can press 'l' to activate a look cursor.
  The cursor starts on the player's tile and can be moved around the visible
  map with the direction keys without advancing the game turn.  The LookPanel
  updates to show information about the tile under the cursor.  Pressing ESC
  or 'l' again deactivates the cursor and hides the LookPanel.

  Scenario: Look cursor starts inactive
    Given a LookCursor
    Then the look cursor should not be active

  Scenario: Activating the cursor places it on the given tile
    Given a LookCursor
    When the look cursor is activated at tile 5, 5
    Then the look cursor should be active
    And the look cursor x should be 5
    And the look cursor y should be 5

  Scenario: Cursor moves right within visible bounds
    Given a LookCursor on a 20x20 map with all tiles visible
    When the look cursor is activated at tile 5, 5
    And the look cursor moves right
    Then the look cursor x should be 6
    And the look cursor y should be 5

  Scenario: Cursor moves left within visible bounds
    Given a LookCursor on a 20x20 map with all tiles visible
    When the look cursor is activated at tile 5, 5
    And the look cursor moves left
    Then the look cursor x should be 4
    And the look cursor y should be 5

  Scenario: Cursor moves up within visible bounds
    Given a LookCursor on a 20x20 map with all tiles visible
    When the look cursor is activated at tile 5, 5
    And the look cursor moves up
    Then the look cursor x should be 5
    And the look cursor y should be 4

  Scenario: Cursor moves down within visible bounds
    Given a LookCursor on a 20x20 map with all tiles visible
    When the look cursor is activated at tile 5, 5
    And the look cursor moves down
    Then the look cursor x should be 5
    And the look cursor y should be 6

  Scenario: Cursor does not move to a tile outside line of sight
    Given a LookCursor on a 20x20 map where only tile 5, 5 is visible
    When the look cursor is activated at tile 5, 5
    And the look cursor moves right
    Then the look cursor x should be 5

  Scenario: Cursor does not move outside the left map boundary
    Given a LookCursor on a 20x20 map with all tiles visible
    When the look cursor is activated at tile 0, 5
    And the look cursor moves left
    Then the look cursor x should be 0

  Scenario: Cursor does not move outside the top map boundary
    Given a LookCursor on a 20x20 map with all tiles visible
    When the look cursor is activated at tile 5, 0
    And the look cursor moves up
    Then the look cursor y should be 0

  Scenario: Cursor does not move outside the right map boundary
    Given a LookCursor on a 20x20 map with all tiles visible
    When the look cursor is activated at tile 19, 5
    And the look cursor moves right
    Then the look cursor x should be 19

  Scenario: Cursor does not move outside the bottom map boundary
    Given a LookCursor on a 20x20 map with all tiles visible
    When the look cursor is activated at tile 5, 19
    And the look cursor moves down
    Then the look cursor y should be 19

  Scenario: Deactivating the cursor marks it inactive
    Given a LookCursor
    When the look cursor is activated at tile 5, 5
    And the look cursor is deactivated
    Then the look cursor should not be active
