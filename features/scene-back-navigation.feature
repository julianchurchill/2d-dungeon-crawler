Feature: In-game screen back navigation returns to in-game menu

  When a screen (Achievements, Help) is opened from the in-game menu,
  pressing Back should return to the in-game menu rather than directly
  to the game.  This is captured in a pure helper so the routing logic
  can be tested independently of Phaser.

  Scenario: Back returns to in-game menu when opened from it
    Given the screen was opened from "InGameMenuScene"
    When the back navigation is resolved
    Then the back action should be "launch"
    And the back target should be "InGameMenuScene"

  Scenario: Back wakes the game when opened directly from GameScene
    Given the screen was opened from "GameScene"
    When the back navigation is resolved
    Then the back action should be "wake"

  Scenario: Back starts the originating scene for non-game origins
    Given the screen was opened from "MainMenuScene"
    When the back navigation is resolved
    Then the back action should be "start"
    And the back target should be "MainMenuScene"
