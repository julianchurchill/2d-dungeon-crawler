Feature: Inventory toggle respects turn state

  The inventory can only be opened or closed when the player is in a state
  that allows it — PLAYER_INPUT to open, INVENTORY to close.  During
  animations (PLAYER_ACTING, ENEMY_ACTING) the toggle must be ignored so
  that the visual panel and the TurnManager state never get out of sync.

  This logic is captured in the pure applyInventoryToggle helper so it can
  be tested independently of Phaser or GameScene.

  Scenario: Inventory opens when player is waiting for input
    Given the turn state is PLAYER_INPUT
    When the inventory toggle fires
    Then the inventory should have opened
    And the turn state should be INVENTORY

  Scenario: Inventory closes when it is already open
    Given the turn state is INVENTORY
    When the inventory toggle fires
    Then the inventory should have closed
    And the turn state should be PLAYER_INPUT

  Scenario: Inventory does not open during player animation
    Given the turn state is PLAYER_ACTING
    When the inventory toggle fires
    Then the inventory should not have opened

  Scenario: Inventory does not open during enemy turn
    Given the turn state is ENEMY_ACTING
    When the inventory toggle fires
    Then the inventory should not have opened
