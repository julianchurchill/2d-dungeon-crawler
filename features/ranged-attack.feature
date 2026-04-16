Feature: Ranged Attack

  The player can fire their equipped ranged weapon in a straight line by
  pressing R (keyboard) or the BOW button (mobile) to enter aim mode, then
  pressing a direction key / button to fire.

  # ── Target finding ───────────────────────────────────────────────────────────

  Scenario: Finds enemy directly ahead within range
    Given the player is at tile 5, 5
    And an enemy is at tile 5, 3
    And no walls block the path
    When finding a ranged target upward with range 6
    Then the ranged target should be the enemy at 5, 3

  Scenario: No target when path is empty
    Given the player is at tile 5, 5
    And no enemies are ahead
    And no walls block the path
    When finding a ranged target upward with range 6
    Then no ranged target should be found

  Scenario: Wall blocks the shot before the enemy
    Given the player is at tile 5, 5
    And a wall at tile 5, 3
    And an enemy is at tile 5, 2
    When finding a ranged target upward with range 6
    Then no ranged target should be found

  Scenario: Enemy beyond max range is not targeted
    Given the player is at tile 5, 5
    And an enemy is at tile 5, -2
    And no walls block the path
    When finding a ranged target upward with range 6
    Then no ranged target should be found

  Scenario: Nearest enemy in line is targeted first
    Given the player is at tile 5, 5
    And an enemy is at tile 5, 4
    And a second enemy is at tile 5, 2
    And no walls block the path
    When finding a ranged target upward with range 6
    Then the ranged target should be the enemy at 5, 4

  # ── Attack resolution ────────────────────────────────────────────────────────

  Scenario: Ranged attack deals damage to the target
    Given a player with ranged attack power 7
    And a goblin with 20 HP and 0 defense
    When the player fires at the goblin with seed 42
    Then the goblin should have taken damage from ranged attack

  Scenario: Ranged attack kills when damage is lethal
    Given a player with ranged attack power 100
    And a goblin with 5 HP and 0 defense
    When the player fires at the goblin with seed 42
    Then the ranged attack result should indicate a kill

  Scenario: Ranged attack message mentions the target
    Given a player with ranged attack power 7
    And a goblin with 20 HP and 0 defense
    When the player fires at the goblin with seed 42
    Then the ranged attack message should mention "Goblin"

  Scenario: Ranged attack message uses "fire" verb
    Given a player with ranged attack power 7
    And a goblin with 20 HP and 0 defense
    When the player fires at the goblin with seed 42
    Then the ranged attack message should contain "fire"

  # ── Player ranged attack power ────────────────────────────────────────────────

  Scenario: Player rangedAttackPower uses only ranged weapon bonus, not melee
    Given a player with base attack 5
    And a short sword in the player inventory
    And a short bow in the player inventory
    When the player equips the short sword
    And the player equips the short bow
    Then the player ranged attack power should be 7

  # ── Help content ─────────────────────────────────────────────────────────────

  Scenario: Keyboard help includes ranged attack binding
    Given the device is not a touch device
    When the help content is retrieved
    Then the help content should mention "fire ranged weapon"

  Scenario: Touch help includes BOW button
    Given the device is a touch device
    When the help content is retrieved
    Then the help content should mention "BOW"
