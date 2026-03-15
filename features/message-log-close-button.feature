Feature: Message log close button

  On touch devices the keyboard ESC key is unavailable, so the message history
  panel header should omit the "ESC to close" hint and instead rely on the
  on-screen close button (X) that is always present.  On non-touch devices the
  ESC hint remains in the header as a convenience reminder.

  Scenario: Header shows ESC hint on non-touch devices
    When the message log panel header text is requested for a non-touch device
    Then the header text should include the ESC close hint

  Scenario: Header hides ESC hint on touch devices
    When the message log panel header text is requested for a touch device
    Then the header text should not include the ESC close hint
