Feature: Hold Key Movement

  Scenario: Pressing a movement key registers the held direction
    Given no movement key is held
    When the right key is pressed on the keyboard
    Then the held movement direction should be right

  Scenario: Releasing a held key clears the direction
    Given the right key is held on the keyboard
    When the right key is released on the keyboard
    Then no movement key should be held

  Scenario: Pressing a different key changes the held direction
    Given the right key is held on the keyboard
    When the up key is pressed on the keyboard
    Then the held movement direction should be up

  Scenario: Releasing a key that is not held does not clear the direction
    Given the right key is held on the keyboard
    When the left key is released on the keyboard
    Then the held movement direction should still be right

  Scenario: Held direction clears when the game over event fires
    Given the right key is held on the keyboard
    When the game over event fires
    Then no movement key should be held
