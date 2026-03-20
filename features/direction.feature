Feature: Direction constants

  Scenario: DIR constants have the correct string values
    Then DIR.UP should equal "UP"
    And DIR.DOWN should equal "DOWN"
    And DIR.LEFT should equal "LEFT"
    And DIR.RIGHT should equal "RIGHT"

  Scenario: UP direction delta moves north
    Then the UP direction delta should have dx 0 and dy -1

  Scenario: DOWN direction delta moves south
    Then the DOWN direction delta should have dx 0 and dy 1

  Scenario: LEFT direction delta moves west
    Then the LEFT direction delta should have dx -1 and dy 0

  Scenario: RIGHT direction delta moves east
    Then the RIGHT direction delta should have dx 1 and dy 0
