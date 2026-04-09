Feature: Buying items from town shops

  Players can spend gold to buy items from town shops.
  Shops sell items with randomly generated stats at a premium over their sell price.
  Each shop type only sells the relevant item category.

  # --- Buying ---

  Scenario: Player can buy an item with sufficient gold
    Given a weapon shop selling a short sword for 20 gold
    And a player with 30 gold
    When the player buys the short sword from the shop
    Then the player should have 10 gold
    And the player should have 1 item in their inventory

  Scenario: Player cannot buy an item without sufficient gold
    Given a weapon shop selling a short sword for 20 gold
    And a player with 5 gold
    When the player tries to buy the short sword from the shop
    Then the player should have 5 gold
    And the player's inventory should be empty

  Scenario: Full inventory prevents buying
    Given a weapon shop selling a short sword for 20 gold
    And a player with a full inventory and 50 gold
    When the player tries to buy the short sword from the shop
    Then the player should still have 50 gold
    And the player's inventory should still be full

  # --- Shop inventory generation ---

  Scenario: Weapon shop generates weapon items
    Given a weapon shop stock generated for a level 1 player
    Then all generated items should be weapons

  Scenario: Armour shop generates armour items
    Given an armour shop stock generated for a level 1 player
    Then all generated items should be armour

  Scenario: Potion shop generates consumable items
    Given a potion shop stock generated for a level 1 player
    Then all generated items should be consumables

  Scenario: Shop buy prices exceed item sell prices
    Given a weapon shop stock generated for a level 1 player
    Then every item should have a buy price greater than its sell price

  Scenario: Weapons have positive attack bonuses
    Given a weapon shop stock generated for a level 1 player
    Then all generated weapons should have a positive attack bonus

  Scenario: Armour has positive defense bonuses
    Given an armour shop stock generated for a level 1 player
    Then all generated armour should have a positive defense bonus

  Scenario: Shop generates at least one item
    Given a weapon shop stock generated for a level 1 player
    Then the shop stock should contain at least 1 item
