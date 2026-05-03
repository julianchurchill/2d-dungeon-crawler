Feature: Town Shops

  Players can sell items from their inventory at town shops in exchange for gold.
  Each shop type (potion, weapon, armour) accepts only the relevant item category.

  # --- Player gold ---

  Scenario: A new player starts with 0 gold
    Given a new player
    Then the player should have 0 gold

  # --- Item sell prices ---

  Scenario: Item types have defined sell prices
    Then the health potion sell price should be 5
    And the mega potion sell price should be 10
    And the short sword sell price should be 15
    And the long sword sell price should be 25
    And the leather shield sell price should be 12
    And the iron shield sell price should be 20
    And the teleport potion sell price should be 8

  # --- Selling ---

  Scenario: Selling a health potion gives the player gold
    Given a player with a health potion in their inventory
    When the player sells the health potion at the potion shop
    Then the player should have 5 gold
    And the player's shop inventory should be empty

  Scenario: Selling a sword gives the player gold
    Given a player with a short sword in their inventory
    When the player sells the short sword at the weapon shop
    Then the player should have 15 gold

  Scenario: Selling multiple items accumulates gold
    Given a player with a health potion in their inventory
    And the player also has a mega potion in their inventory
    When the player sells the health potion at the potion shop
    And the player sells the mega potion at the potion shop
    Then the player should have 15 gold

  # --- Shop item filtering ---

  Scenario: The potion shop accepts consumable items
    Given a potion shop
    Then the shop accepts the health potion
    And the shop accepts the mega potion
    And the shop accepts the teleport potion

  Scenario: The potion shop does not accept weapons or armour
    Given a potion shop
    Then the shop does not accept the short sword
    And the shop does not accept leather armor

  Scenario: The weapon shop accepts weapon items
    Given a weapon shop
    Then the shop accepts the short sword
    And the shop accepts the long sword

  Scenario: The weapon shop does not accept potions or armour
    Given a weapon shop
    Then the shop does not accept the health potion
    And the shop does not accept leather armor

  Scenario: The armour shop accepts armour items
    Given an armour shop
    Then the shop accepts leather armor
    And the shop accepts chain mail

  Scenario: The armour shop accepts all equipment slot types
    Given an armour shop
    Then the shop accepts leather boots
    And the shop accepts leather cap
    And the shop accepts leather chestpiece
    And the shop accepts leather leggings
    And the shop accepts leather gauntlets
    And the shop accepts iron ring
    And the shop accepts stone amulet

  Scenario: The armour shop does not accept potions or weapons
    Given an armour shop
    Then the shop does not accept the health potion
    And the shop does not accept the short sword

  # --- Unequip on sell ---

  Scenario: Selling an equipped weapon unequips it
    Given a player with a short sword in their inventory
    And the short sword is equipped as weapon
    When the player sells the short sword at the weapon shop
    Then the player's equipped weapon should be null

  Scenario: Selling an equipped armour item unequips it
    Given a player with leather armor in their inventory
    And the leather armor is equipped as armor
    When the player sells the leather armor at the armour shop
    Then the player's equipped armor should be null
