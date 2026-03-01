Feature: Combat

  Scenario: Player attacks an adjacent enemy and deals damage
    Given a player with 5 attack power
    And a goblin with 8 HP and 1 defense
    When the player attacks the goblin with seed 42
    Then the goblin should have taken damage
    And the attack result message should mention the goblin

  Scenario: Attack damage is always at least 1
    Given a player with 1 attack power
    And a goblin with 100 HP and 0 defense
    When the player attacks the goblin 20 times with consecutive seeds
    Then every attack should have dealt at least 1 damage

  Scenario: Player kills an enemy when damage is lethal
    Given a player with 100 attack power
    And a goblin with 8 HP and 1 defense
    When the player attacks the goblin with seed 42
    Then the goblin should be dead
    And the attack result should indicate a kill

  Scenario: Enemy attacks the player and reduces HP
    Given a player at full health with 2 defense
    And a goblin with 5 attack
    When the goblin attacks the player with seed 42
    Then the player HP should be lower than before the attack

  Scenario: Player is detected as dead when HP drops to zero
    Given a player with 1 HP and 0 defense
    And a goblin with 100 attack
    When the goblin attacks the player with seed 1
    Then the player should be dead
