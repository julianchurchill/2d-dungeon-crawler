Feature: PlayerActionHandler

  PlayerActionHandler is responsible for all player-turn logic: movement,
  melee and ranged combat, item use and drop, floor transitions, and run
  auto-movement. It accepts a scene context and exposes each action as a
  named method.

  Scenario: ascend() places the player at the stairs-up position on the destination floor
    Given a PlayerActionHandler bound to an ascend test scene with stairsPos at 10,5 and stairsUpPos at 3,3
    When ascend is called on the handler
    Then the player x should be 3
    And the player y should be 3

  Scenario: PlayerActionHandler exposes the expected player-turn methods
    Given a PlayerActionHandler bound to a minimal scene context
    Then the handler exposes handleDir
    And the handler exposes doPlayerMove
    And the handler exposes doRangedAttack
    And the handler exposes useInventoryItem
    And the handler exposes dropInventoryItem
    And the handler exposes tryUseStairs
    And the handler exposes checkItemPickup
    And the handler exposes beginPlayerTurn
    And the handler exposes continueRun
