Feature: Inventory panel adapts to touch devices

  On touch devices the keyboard hint in the inventory title is irrelevant
  and a close button must be visible so the panel can be dismissed without
  a keyboard.  This mirrors the behaviour of the message log panel.

  The title text logic is captured in a pure function so it can be tested
  independently of Phaser.

  Scenario: Title shows keyboard hints on non-touch devices
    Given the device is not a touch device
    When the inventory panel title text is retrieved
    Then the title should include "[I] close"

  Scenario: Title hides keyboard hints on touch devices
    Given the device is a touch device
    When the inventory panel title text is retrieved
    Then the title should not include "[I] close"
