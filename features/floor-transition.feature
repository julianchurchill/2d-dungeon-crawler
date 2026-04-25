Feature: Floor transition blocks stair input while transitioning
  Pressing '>' or '.' rapidly on stairs should not trigger more than one
  floor transition.  Once a descent or ascent begins the turn state must
  move to TRANSITIONING so that any further stair input is ignored until
  the new floor has finished loading.

  Scenario: Starting a floor transition accepts the action and sets state to TRANSITIONING
    Given the turn manager is in the PLAYER_INPUT state
    When a floor transition is started
    Then the floor transition should have been accepted
    And the turn manager state should be TRANSITIONING

  Scenario: A second floor transition is blocked while one is already in progress
    Given the turn manager is in the TRANSITIONING state
    When a floor transition is started
    Then the floor transition should have been rejected

  Scenario: A floor transition is blocked during enemy turns
    Given the turn manager is in the ENEMY_ACTING state
    When a floor transition is started
    Then the floor transition should have been rejected
