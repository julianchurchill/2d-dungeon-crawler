Feature: Inventory Panel Display

  Scenario: Equipped weapon name updates while the inventory panel is open
    Given the inventory panel is open showing a player with a short sword in inventory
    When the player equips the short sword via the inventory panel
    Then the inventory panel should show "Short Sword" as the equipped weapon

  Scenario: Equipped armor name updates while the inventory panel is open
    Given the inventory panel is open showing a player with leather armor in inventory
    When the player equips the leather armor via the inventory panel
    Then the inventory panel should show "Leather Armor" as the equipped armor
