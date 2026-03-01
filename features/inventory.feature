Feature: Inventory Management

  Scenario: Player picks up a health potion
    Given a player with an empty inventory
    And a health potion on the ground
    When the player picks up the health potion
    Then the player inventory should contain 1 item
    And the inventory should contain a health potion

  Scenario: Player uses a health potion and restores HP
    Given a player with 15 HP out of 30 maximum
    And a health potion in the player inventory
    When the player uses the health potion
    Then the player HP should be 30
    And the health potion should be removed from the inventory

  Scenario: Using a health potion does not exceed maximum HP
    Given a player at full health with 30 HP maximum
    And a health potion in the player inventory
    When the player uses the health potion
    Then the player HP should still be 30

  Scenario: Player equips a sword and gains attack power
    Given a player with base attack 5
    And a short sword in the player inventory
    When the player equips the short sword
    Then the player attack power should be 8
    And the short sword should be the equipped weapon

  Scenario: Player equips leather armor and gains defense
    Given a player with base defense 2
    And leather armor in the player inventory
    When the player equips the leather armor
    Then the player defense power should be 4
    And the leather armor should be the equipped armor

  Scenario: Player cannot pick up items when inventory is full
    Given a player with a full inventory of 20 items
    And a health potion on the ground
    When the player tries to pick up the health potion
    Then the pickup should fail with message "Your pack is full!"

  Scenario: Player drops an item from inventory
    Given a player at position 5, 5 with a health potion in inventory
    When the player drops the health potion
    Then the inventory should be empty
    And the dropped item should be at position 5, 5
