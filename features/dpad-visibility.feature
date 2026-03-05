Feature: Mobile D-pad visibility

  The on-screen D-pad is shown only on devices that support touch input,
  keeping the interface clean for keyboard and mouse users.

  A device is considered a touchscreen only when it both reports touch points
  AND has a coarse pointer (i.e. a finger). This prevents Windows laptops with
  precision touchpads from incorrectly showing the D-pad, as they report
  touch points despite having no touchscreen.

  Scenario: D-pad is shown on a touchscreen with touch points and a coarse pointer
    Given the device reports 1 touch point
    And the device has a coarse pointer
    Then the device is detected as a touch device

  Scenario: D-pad is shown on a multi-touch screen with a coarse pointer
    Given the device reports 5 touch points
    And the device has a coarse pointer
    Then the device is detected as a touch device

  Scenario: D-pad is hidden on a laptop touchpad with touch points but a fine pointer
    Given the device reports 2 touch points
    And the device has a fine pointer
    Then the device is not detected as a touch device

  Scenario: D-pad is hidden on a device with no touch points
    Given the device reports 0 touch points
    And the device has a fine pointer
    Then the device is not detected as a touch device
