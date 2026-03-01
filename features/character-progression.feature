Feature: Character Progression

  Scenario: Player gains XP without reaching the level-up threshold
    Given a player at level 1 needing 20 XP to level up
    When the player gains 10 XP
    Then the player XP should be 10
    And the player should still be level 1

  Scenario: Player levels up when the XP threshold is reached
    Given a player at level 1 needing 20 XP to level up
    When the player gains 20 XP
    Then the player should be level 2
    And the player max HP should have increased by 5
    And the player attack should have increased by 1
    And the XP threshold for the next level should be 30

  Scenario: Player can gain multiple levels from a single XP reward
    Given a player at level 1 needing 20 XP to level up
    When the player gains 100 XP
    Then the player level should be greater than 2

  Scenario: Player HP is restored when leveling up
    Given a player at level 1 with 10 HP out of 30 maximum
    When the player gains 20 XP
    Then the player HP should have increased
