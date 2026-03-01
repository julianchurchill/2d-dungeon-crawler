Feature: Turn Management

  Scenario: The game starts accepting player input
    Given a new turn manager
    Then the turn state should be "PLAYER_INPUT"
    And the game should be accepting player input

  Scenario: Player input is not accepted while the player is acting
    Given a new turn manager
    When the player starts acting
    Then the turn state should be "PLAYER_ACTING"
    And the game should not be accepting player input

  Scenario: Player input is not accepted during enemy turns
    Given a new turn manager
    When the enemy turn begins
    Then the turn state should be "ENEMY_ACTING"
    And the game should not be accepting player input

  Scenario: A full turn cycle returns to accepting player input
    Given a new turn manager
    When the player starts acting
    And the enemy turn begins
    And the enemy turn ends
    Then the turn state should be "PLAYER_INPUT"
    And the game should be accepting player input

  Scenario: Game over does not accept player input
    Given a new turn manager
    When game over occurs
    Then the turn state should be "GAME_OVER"
    And the game should not be accepting player input

  Scenario: Opening the inventory does not accept movement input
    Given a new turn manager
    When the inventory is opened
    Then the turn state should be "INVENTORY"
    And the game should not be accepting player input
