Feature: Mobile D-pad visibility

  The on-screen D-pad is shown only on devices that support touch input,
  keeping the interface clean for keyboard and mouse users.

  Scenario: D-pad is shown on a device with touch support
    Given the device reports 1 touch point
    Then the device is detected as a touch device

  Scenario: D-pad is shown on a device with multiple touch points
    Given the device reports 5 touch points
    Then the device is detected as a touch device

  Scenario: D-pad is hidden on a device with no touch support
    Given the device reports 0 touch points
    Then the device is not detected as a touch device
