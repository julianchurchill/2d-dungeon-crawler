Feature: Unique items

  Unique items bear a unique flag and cannot be sold at any shop.

  Scenario: A unique item has its unique flag set
    Given the Bone Blade item type
    Then the item should be marked as unique

  Scenario: A non-unique item does not have the unique flag set
    Given a health potion item
    Then the item should not be marked as unique

  Scenario: A unique weapon cannot be sold at the weapon shop
    Given a player with a Bone Blade in their inventory
    And a weapon shop
    When the player tries to sell the Bone Blade at the weapon shop
    Then the sale should fail
    And the player should have 0 gold

  Scenario: A unique armor cannot be sold at the armour shop
    Given a player with a Skeleton Shield in their inventory
    And an armour shop
    When the player tries to sell the Skeleton Shield at the armour shop
    Then the sale should fail

  Scenario: A non-unique weapon can still be sold normally
    Given a player with a short sword in their inventory
    And a weapon shop
    When the player sells the short sword at the weapon shop
    Then the player should have gold equal to the sword sell price
