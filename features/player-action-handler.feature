Feature: PlayerActionHandler

  PlayerActionHandler is responsible for all player-turn logic: movement,
  melee and ranged combat, item use and drop, floor transitions, and run
  auto-movement. It accepts a scene context and exposes each action as a
  named method.

  # Documents that ascending lands the player at the stairs-DOWN tile (stairsPos) on the
  # destination floor — i.e. the physical connection point between the two floors — NOT at
  # the stairs-UP tile (stairsUpPos) which leads further toward town. See issue #240.
  Scenario: ascend() places the player at the stairs-down tile on the destination floor
    Given a PlayerActionHandler bound to an ascend test scene with stairsPos at 10,5 and stairsUpPos at 3,3
    When ascend is called on the handler
    Then the player x should be 10
    And the player y should be 5

  # Documents that equipping a non-consumable item (weapon, armour, ring, etc.) from the
  # inventory panel is intentionally free — it does not consume the player's turn, so
  # enemies do not act and the panel stays open. See issue #241.
  Scenario: equipping an item from inventory keeps the inventory panel open
    Given a PlayerActionHandler with a weapon in inventory and turn state INVENTORY
    When the player uses inventory item at index 0
    Then the turn state should still be INVENTORY

  Scenario: equipping an item from inventory does not trigger enemy turns
    Given a PlayerActionHandler with a weapon in inventory and turn state INVENTORY
    When the player uses inventory item at index 0
    Then enemy turns should not have started

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
