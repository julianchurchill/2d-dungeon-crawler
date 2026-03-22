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

  Scenario: A briefly pressed and released key does not register as held
    Given no movement key is held
    When the right key is briefly pressed and released
    Then no movement key should be held

  # Arrow keys — all four directions

  Scenario: UP arrow key registers up direction
    Given no movement key is held
    When the UP key is pressed on the keyboard
    Then the held movement direction should be up

  Scenario: DOWN arrow key registers down direction
    Given no movement key is held
    When the DOWN key is pressed on the keyboard
    Then the held movement direction should be down

  Scenario: LEFT arrow key registers left direction
    Given no movement key is held
    When the LEFT key is pressed on the keyboard
    Then the held movement direction should be left

  # WASD aliases

  Scenario: W key registers up direction
    Given no movement key is held
    When the W key is pressed on the keyboard
    Then the held movement direction should be up

  Scenario: S key registers down direction
    Given no movement key is held
    When the S key is pressed on the keyboard
    Then the held movement direction should be down

  Scenario: A key registers left direction
    Given no movement key is held
    When the A key is pressed on the keyboard
    Then the held movement direction should be left

  Scenario: D key registers right direction
    Given no movement key is held
    When the D key is pressed on the keyboard
    Then the held movement direction should be right

  Scenario: Releasing a held WASD key clears the direction
    Given the W key is held on the keyboard
    When the W key is released on the keyboard
    Then no movement key should be held

  Scenario: Releasing a WASD key that is not held does not clear the direction
    Given the W key is held on the keyboard
    When the S key is released on the keyboard
    Then the held movement direction should be up

  # open-inventory event

  Scenario: Held direction clears when the open inventory event fires
    Given the right key is held on the keyboard
    When the open inventory event fires
    Then no movement key should be held

  # clear() method

  Scenario: Calling clear() removes any held direction
    Given the right key is held on the keyboard
    When clear is called on the held movement tracker
    Then no movement key should be held

  # D-pad events

  Scenario: D-pad hold start sets the held direction
    Given no movement key is held
    When the D-pad hold start event fires for the right direction
    Then the held movement direction should be right

  Scenario: D-pad hold end clears the held direction
    Given no movement key is held
    When the D-pad hold start event fires for the right direction
    And the D-pad hold end event fires for the right direction
    Then no movement key should be held

  Scenario: D-pad hold end does not clear a different held direction
    Given no movement key is held
    When the D-pad hold start event fires for the right direction
    And the D-pad hold end event fires for the up direction
    Then the held movement direction should still be right
