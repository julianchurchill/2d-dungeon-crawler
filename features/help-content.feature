Feature: In-game help content adapts to device type

  The help screen shows control instructions relevant to the current device.
  On touch devices (mobile) it shows tap/double-tap/hold button controls;
  on non-touch devices (keyboard) it shows key bindings.

  This logic is captured in the pure getHelpContent helper so it can be
  tested independently of Phaser.

  Scenario: Help content includes touch controls on mobile
    Given the device is a touch device
    When the help content is retrieved
    Then the help content should mention "double-tap"
    And the help content should not mention "SHIFT"

  Scenario: Help content includes keyboard controls on desktop
    Given the device is not a touch device
    When the help content is retrieved
    Then the help content should mention "SHIFT"
    And the help content should not mention "double-tap"

  Scenario: Keyboard help content includes skills key binding
    Given the device is not a touch device
    When the help content is retrieved
    Then the help content should mention "open skills"

  Scenario: Touch help content includes skills button
    Given the device is a touch device
    When the help content is retrieved
    Then the help content should mention "SKILLS"
