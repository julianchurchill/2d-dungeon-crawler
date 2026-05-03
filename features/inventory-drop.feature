Feature: Drop items from inventory

  The player can drop an item from their inventory onto the current floor
  tile by pressing X while the inventory panel is open.  On touch devices
  a DROP button is shown instead.  Dropping removes the item from the
  player's inventory and returns it to the floor.

  Scenario: Title shows drop hint on non-touch devices
    Given the device is not a touch device
    When the inventory panel title text is retrieved
    Then the title should include "[X] drop"

  Scenario: Title hides drop hint on touch devices
    Given the device is a touch device
    When the inventory panel title text is retrieved
    Then the title should not include "[X] drop"

  Scenario: Dropping an item removes it from the player's inventory
    Given a player carrying a "health_potion" in inventory slot 0
    When the player drops the item at inventory index 0
    Then the player's inventory should be empty after dropping

  Scenario: Dropping an item returns the item at the player's position
    Given a player carrying a "health_potion" in inventory slot 0
    When the player drops the item at inventory index 0
    Then the dropped result should have item id "health_potion"
    And the dropped item position should match the player position

  Scenario: Dropping from an empty slot returns null
    Given a player with no items in their inventory
    When the player drops the item at inventory index 0
    Then the dropped result should be null

  # ── Dropping equipped items ──────────────────────────────────────────────────

  Scenario: Dropping an equipped weapon unequips it
    Given a player with a sword equipped at inventory index 0
    When the player drops the item at inventory index 0
    Then the player's equipped weapon slot should be empty

  Scenario: Dropping an equipped armour unequips it
    Given a player with a leather shield equipped at inventory index 0
    When the player drops the item at inventory index 0
    Then the player's equipped armour slot should be empty

  Scenario: Dropping an unequipped item does not clear any equipment slot
    Given a player carrying a "health_potion" in inventory slot 0
    And the player has a sword equipped
    When the player drops the item at inventory index 0
    Then the player's equipped weapon slot should not be empty
