Feature: Mobile menu button opens Achievements or closes message log

  The on-screen menu button (≡) acts as a mobile equivalent of the ESC key.
  When the message log history panel is open it closes the panel; otherwise
  it opens the Achievements screen.  This logic is captured in a pure
  function so it can be tested independently of Phaser.

  Scenario: Menu button opens Achievements when message log is closed
    Given the message log is closed
    When the mobile menu button is pressed
    Then the achievements screen should open

  Scenario: Menu button closes message log when it is open
    Given the message log is open
    When the mobile menu button is pressed
    Then the message log should close

  Scenario: Menu button does not open Achievements while message log is open
    Given the message log is open
    When the mobile menu button is pressed
    Then the achievements screen should not open
