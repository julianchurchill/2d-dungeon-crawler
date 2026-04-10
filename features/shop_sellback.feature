Feature: Shop sell-back

  When the player sells an item to a shop, that item becomes available
  to buy back from the same shop at 10% above its original sell price
  (rounded up to the nearest gold).

  # --- Buy-back price calculation ---

  Scenario: Buy-back price of a health potion is 10% above its sell price
    Given a potion shop
    Then the buy-back price of a health potion should be 6 gold

  Scenario: Buy-back price of a short sword is 10% above its sell price
    Given a weapon shop
    Then the buy-back price of a short sword should be 17 gold

  Scenario: Buy-back price of leather armor is 10% above its sell price
    Given an armour shop
    Then the buy-back price of leather armor should be 14 gold

  Scenario: Buy-back price is always rounded up
    Given a potion shop
    Then the buy-back price of a mega potion should be 11 gold

  # --- Buy-back stock entry ---

  Scenario: Selling an item produces a buy-back entry with the correct price
    Given a weapon shop
    When a buy-back entry is created for a short sword
    Then the buy-back entry should contain the short sword
    And the buy-back entry price should be 17 gold

  Scenario: Selling an item produces a buy-back entry the shop accepts
    Given a weapon shop
    When a buy-back entry is created for a short sword
    Then the shop should accept the buy-back item
