Feature: Display Case

  The player's home in the town contains a display case for storing unique items.
  Unique items removed from the inventory are stored here and can be retrieved later.

  # --- DisplayCase data structure ---

  Scenario: A new display case is empty
    Given a new display case
    Then the display case should be empty

  Scenario: A unique item can be stored in the display case
    Given a new display case
    And a Bone Blade item
    When the item is stored in the display case
    Then the display case should contain 1 item

  Scenario: A non-unique item cannot be stored in the display case
    Given a new display case
    And a health potion item
    When the non-unique item is stored in the display case
    Then the storage should fail
    And the display case should be empty

  Scenario: A stored item can be retrieved from the display case
    Given a display case containing a Bone Blade
    When the Bone Blade is retrieved from the display case at index 0
    Then the display case should be empty
    And the retrieved item should be the Bone Blade

  Scenario: Retrieving from an invalid index returns null
    Given a new display case
    When the Bone Blade is retrieved from the display case at index 0
    Then the retrieved item should be null

  # --- Town map ---

  Scenario: The town map contains a home door tile
    Given the town is generated
    Then the town map should contain a home door tile

  Scenario: The town generation result includes the home door position
    Given the town is generated
    Then the town result should include a home door position
