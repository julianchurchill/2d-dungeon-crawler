Feature: ESC closes the active panel

  ESC should close whichever panel is currently open rather than opening
  the in-game menu.  The logic is captured in the pure applyEscPanelClose
  helper so it can be tested independently of Phaser or GameScene.

  Scenario: ESC closes the inventory panel when it is open
    Given the turn state is INVENTORY
    When ESC closes the active panel
    Then the panel close action should be "close-inventory"
    And the turn state should be PLAYER_INPUT

  Scenario: ESC closes the skills panel when it is open
    Given the turn state is SKILLS
    When ESC closes the active panel
    Then the panel close action should be "close-skills"
    And the turn state should be PLAYER_INPUT

  Scenario: ESC has no panel to close when the player is idle
    Given the turn state is PLAYER_INPUT
    When ESC closes the active panel
    Then no panel close action should occur
    And the turn state should be PLAYER_INPUT
