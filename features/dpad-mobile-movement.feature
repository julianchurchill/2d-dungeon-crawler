Feature: Mobile D-pad hold and double-tap

  Holding a d-pad direction button auto-repeats movement (like holding a
  keyboard key). Double-tapping a direction button starts a run in that
  direction (like SHIFT+direction on keyboard).

  # ── Hold detection (via HeldMovementTracker) ─────────────────────────────

  Scenario: Pressing a d-pad button registers the held direction
    Given no direction is held via the d-pad
    When the up d-pad button is pressed
    Then the d-pad held direction should be up

  Scenario: Releasing a d-pad button clears the held direction
    Given the up d-pad button is held
    When the up d-pad button is released
    Then no d-pad direction should be held

  Scenario: Releasing a direction that is not held does not clear the direction
    Given the up d-pad button is held
    When the right d-pad button is released
    Then the d-pad held direction should be up

  Scenario: Pressing a second d-pad direction replaces the first
    Given the up d-pad button is held
    When the right d-pad button is pressed
    Then the d-pad held direction should be right

  Scenario: D-pad held direction clears when game over fires
    Given the up d-pad button is held
    When the game over event fires on the dpad tracker
    Then no d-pad direction should be held

  # ── Double-tap detection ──────────────────────────────────────────────────

  Scenario: Tapping the same direction twice quickly is a double-tap
    Given the double-tap detector is ready
    When the up d-pad button is tapped
    And the up d-pad button is tapped again quickly
    Then a double-tap should be detected

  Scenario: Tapping two different directions quickly is not a double-tap
    Given the double-tap detector is ready
    When the up d-pad button is tapped
    And the right d-pad button is tapped quickly
    Then a double-tap should not be detected

  Scenario: Tapping the same direction too slowly is not a double-tap
    Given the double-tap detector is ready
    When the up d-pad button is tapped
    And time passes beyond the double-tap threshold
    And the up d-pad button is tapped again
    Then a double-tap should not be detected
