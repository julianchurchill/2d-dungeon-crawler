Feature: Hold Key Movement

  Scenario: Holding a movement key registers the direction
    Given no movement key is held
    When the player presses and holds the right key
    Then the held movement direction should be right

  Scenario: Releasing a held key clears the direction
    Given the player is holding the right key
    When the player releases the right key
    Then no movement key should be held

  Scenario: Pressing a different key changes the held direction
    Given the player is holding the right key
    When the player presses and holds the up key
    Then the held movement direction should be up

  Scenario: Releasing a key that is not held does not clear the direction
    Given the player is holding the right key
    When the player releases the left key
    Then the held movement direction should still be right
