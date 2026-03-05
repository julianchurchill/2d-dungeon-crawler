Feature: Run movement

  Pressing SHIFT+direction auto-runs the player one tile per turn in that
  direction. Each step is a normal turn. The run stops when the next tile
  is blocked, an entity occupies the next tile, or any enemy or item is
  currently visible in the field of view.

  Scenario: Run starts and is active
    Given no run is in progress
    When the player starts a run to the right
    Then the run should be active
    And the run direction should be right

  Scenario: Run continues when the path is clear and nothing is visible
    Given a run to the right is in progress
    When the run is checked with a clear path and nothing visible
    Then the run should still be active

  Scenario: Run stops when the next tile is blocked
    Given a run to the right is in progress
    When the run is checked with a blocked path and nothing visible
    Then the run should not be active

  Scenario: Run stops when an enemy is visible
    Given a run to the right is in progress
    When the run is checked with a clear path and an entity visible
    Then the run should not be active

  Scenario: Run stops when an item is visible
    Given a run to the right is in progress
    When the run is checked with a clear path and an entity visible
    Then the run should not be active

  Scenario: Cancel stops the run
    Given a run to the right is in progress
    When the run is cancelled
    Then the run should not be active

  Scenario: Starting a new run replaces the active direction
    Given a run to the right is in progress
    When the player starts a run upward
    Then the run direction should be up
