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

  Scenario: Attack damage reflects variance correctly for a known seed
    Given a player with 10 attack power
    And a goblin with 100 HP and 0 defense
    When the player attacks the goblin with seed 7
    Then the attack result damage should be 8

  Scenario: Player non-kill attack message uses correct verbs and names
    Given a player with 5 attack power
    And a goblin with 100 HP and 0 defense
    When the player attacks the goblin with seed 42
    Then the attack result message should start with "You"
    And the attack result message should contain "hit"
    And the attack result message should not contain "kill"
    And the attack result message should end with "damage."

  Scenario: Enemy non-kill attack message uses correct verbs and names
    Given a player at full health with 0 defense
    And a goblin with 5 attack
    When the goblin attacks the player with seed 42
    Then the attack result message should contain "Goblin"
    And the attack result message should contain "hits"
    And the attack result message should contain "you"
    And the attack result message should not contain "kill"
    And the attack result message should end with "damage."

  Scenario: Player kill message uses "kill" and exclamation mark
    Given a player with 100 attack power
    And a goblin with 8 HP and 0 defense
    When the player attacks the goblin with seed 42
    Then the attack result message should start with "You"
    And the attack result message should contain "kill"
    And the attack result message should not contain "kills"
    And the attack result message should end with "damage!"

  Scenario: Enemy kill message uses "kills" and exclamation mark
    Given a player with 1 HP and 0 defense
    And a goblin with 100 attack
    When the goblin attacks the player with seed 1
    Then the attack result message should contain "Goblin"
    And the attack result message should contain "kills"
    And the attack result message should contain "you"
    And the attack result message should end with "damage!"
