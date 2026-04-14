Feature: Display Case Panel interactions

  When the player enters their home, they can store unique items from their
  inventory into the display case and retrieve them again later.

  Scenario: Storing a unique item moves it from inventory to display case
    Given a player with a Bone Blade in their inventory
    And a new display case
    When the player stores inventory item at index 0 in the display case
    Then the player inventory should not contain the Bone Blade
    And the display case should contain 1 item

  Scenario: Retrieving an item moves it from display case to inventory
    Given a player with an empty inventory
    And a display case containing a Bone Blade
    When the player retrieves display case item at index 0
    Then the player inventory should contain the Bone Blade
    And the display case should be empty

  Scenario: Retrieving fails gracefully when inventory is full
    Given a player with a full inventory of 20 items
    And a display case containing a Bone Blade
    When the player retrieves display case item at index 0
    Then the display case should still contain 1 item
    And a message should say the inventory is full

  Scenario: Storing emits OPEN_DISPLAY_CASE event with updated state
    Given a player with a Bone Blade in their inventory
    And a new display case
    When the player stores inventory item at index 0 in the display case
    Then the DISPLAY_CASE_CHANGED event should have been emitted

  Scenario: Display case panel is centred on screen when opened
    Given a player with a Bone Blade in their inventory
    And a new display case
    When the display case panel is shown on an 800x600 screen
    Then the display case panel should be vertically centred on that screen
