Feature: Look

  The player can click or touch any cell that is currently visible in their
  line of sight to see a description of what occupies it.  The description
  appears in a panel at the edge of the screen.  Using look does not advance
  the game turn.

  Scenario: Looking at an enemy shows its name and current HP
    Given a LookPanel
    When the look panel is shown for an enemy named "Goblin" with 5 of 8 HP
    Then the look panel should be visible
    And the look panel should display the name "Goblin"
    And the look panel should display the detail "5 / 8 HP"

  Scenario: Looking at an item shows its name and description
    Given a LookPanel
    When the look panel is shown for an item named "Short Sword" described as "+3 Attack"
    Then the look panel should be visible
    And the look panel should display the name "Short Sword"
    And the look panel should display the detail "+3 Attack"

  Scenario: Looking at a floor tile shows the tile name
    Given a LookPanel
    When the look panel is shown for a floor tile
    Then the look panel should be visible
    And the look panel should display the name "Stone Floor"

  Scenario: Looking at a wall tile shows the tile name
    Given a LookPanel
    When the look panel is shown for a wall tile
    Then the look panel should be visible
    And the look panel should display the name "Stone Wall"

  Scenario: Looking at a door shows the tile name
    Given a LookPanel
    When the look panel is shown for a door tile
    Then the look panel should display the name "Door"

  Scenario: Looking at stairs down shows the tile name
    Given a LookPanel
    When the look panel is shown for a stairs down tile
    Then the look panel should display the name "Stairs Down"

  Scenario: Looking at stairs up shows the tile name
    Given a LookPanel
    When the look panel is shown for a stairs up tile
    Then the look panel should display the name "Stairs Up"

  Scenario: The look panel hides when hide is called
    Given a LookPanel
    When the look panel is shown for a floor tile
    And the look panel is hidden
    Then the look panel should not be visible

  Scenario: The look panel starts hidden
    Given a LookPanel
    Then the look panel should not be visible

  Scenario: Panel position compensates for camera zoom
    Given a LookPanel in a scene with camera zoom 2
    Then the panel position x should be 296
    And the panel position y should be 267
