Feature: GameLifecycleHandler

  GameLifecycleHandler encapsulates the game-over, restart, resurrect,
  save-and-exit, and save-restore handlers extracted from GameScene:
  handling player death, restarting the game, dev-mode resurrection,
  saving and exiting to the main menu, and restoring state from a save.
  It accepts a scene reference and exposes each operation as a named method.

  Scenario: GameLifecycleHandler exposes the expected lifecycle methods
    Given a GameLifecycleHandler bound to a minimal scene context
    Then the game lifecycle handler exposes gameOver
    And the game lifecycle handler exposes resurrect
    And the game lifecycle handler exposes restart
    And the game lifecycle handler exposes handleSaveAndExit
    And the game lifecycle handler exposes applyLoadedSave
