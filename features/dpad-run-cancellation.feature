Feature: Mobile d-pad button press cancels active run

  Any mobile button press (direction tap, INV, stairs) should cancel an
  active run before executing its own action — mirroring the keyboard
  behaviour where every key handler calls runController.cancel() first.

  This is captured in the pure wrapWithRunCancel helper so the logic can
  be tested independently of Phaser.

  Scenario: Active run is cancelled before a mobile action executes
    Given a run is active on the run controller
    When a mobile action wrapped with run-cancel fires
    Then the run should be stopped
    And the wrapped action should have executed

  Scenario: Wrapped action still executes when no run is active
    Given no run is active on the run controller
    When a mobile action wrapped with run-cancel fires
    Then the wrapped action should have executed

  Scenario: Wrapped action receives its arguments unchanged
    Given no run is active on the run controller
    When a mobile direction action wrapped with run-cancel fires with UP
    Then the wrapped action should have received the UP direction
