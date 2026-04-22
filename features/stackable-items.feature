Feature: Stackable inventory items
  Potions and other consumables stack in a single inventory slot rather than
  occupying multiple slots. Using or selling a stacked item only affects one
  at a time.

  Scenario: Health potions are stackable
    Given a health potion item type
    Then the item type should be stackable

  Scenario: Mega potions are stackable
    Given a mega potion item type
    Then the item type should be stackable

  Scenario: Teleport potions are stackable
    Given a teleport potion item type
    Then the item type should be stackable

  Scenario: Weapons are not stackable
    Given a short sword item type
    Then the item type should not be stackable

  Scenario: Picking up a second health potion stacks it with the first
    Given a player with an empty inventory
    And a health potion in the player inventory
    When the player picks up another health potion
    Then the inventory slot count should be 1
    And the first slot stack count should be 2

  Scenario: A full inventory still accepts a stackable item when a matching stack exists
    Given a player with an empty inventory capped at 1 slot
    And a health potion in the player inventory
    When the player tries to pick up another health potion
    Then the pickup result should indicate success
    And the first slot stack count should be 2

  Scenario: A full inventory rejects a new item when no matching stack exists
    Given a player with an empty inventory capped at 1 slot
    And a health potion in the player inventory
    When the player tries to pick up a short sword
    Then the pickup result should indicate failure

  Scenario: Using one potion from a stack of three leaves a stack of two
    Given a player with 10 HP out of 30 maximum
    And a health potion stack of 3 in the player inventory
    When the player uses the stacked health potion
    Then the inventory slot count should be 1
    And the first slot stack count should be 2

  Scenario: Using the last potion in a stack removes the slot from inventory
    Given a player with 10 HP out of 30 maximum
    And a health potion stack of 1 in the player inventory
    When the player uses the stacked health potion
    Then the inventory should be empty

  Scenario: Selling one potion from a stack of three decrements the stack
    Given a player with an empty inventory
    And a health potion stack of 3 in the player inventory
    When the player sells one stacked health potion at a potion shop
    Then the inventory slot count should be 1
    And the first slot stack count should be 2
    And the player should have 5 gold

  Scenario: Selling the last potion in a stack removes the slot from inventory
    Given a player with an empty inventory
    And a health potion stack of 1 in the player inventory
    When the player sells one stacked health potion at a potion shop
    Then the inventory should be empty
    And the player should have 5 gold
