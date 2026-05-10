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

  Scenario: Equipping a weapon emits PLAYER_STATS_CHANGED with effective attack bonus
    Given a player with base attack 5
    And a short sword in the player inventory
    When the player equips the short sword
    Then the PLAYER_STATS_CHANGED event should carry attack 8

  Scenario: Equipping armor emits PLAYER_STATS_CHANGED with effective defense bonus
    Given a player with base defense 2
    And leather armor in the player inventory
    When the player equips the leather armor
    Then the PLAYER_STATS_CHANGED event should carry defense 4

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

  Scenario: Item with a shortName exposes shortName for display
    Given the Potion of Minor Teleportation item type
    Then the item shortName should be defined
    And the item shortName should be shorter than the full name

  Scenario: Item without a shortName has no shortName property defined
    Given the Health Potion item type
    Then the item shortName should not be defined

  Scenario: Player equips a short bow and gains ranged attack power
    Given a player with base attack 5
    And a short bow in the player inventory
    When the player equips the short bow
    Then the player ranged attack power should be 7
    And the short bow should be the equipped ranged weapon

  Scenario: Player equips a leather cap and gains defense
    Given a player with base defense 2
    And a leather cap in the player inventory
    When the player equips the leather cap
    Then the player defense power should be 3
    And the leather cap should be the equipped helmet

  Scenario: Player equips a leather chestpiece and gains defense
    Given a player with base defense 2
    And a leather chestpiece in the player inventory
    When the player equips the leather chestpiece
    Then the player defense power should be 4
    And the leather chestpiece should be the equipped chest

  Scenario: Player equips leather leggings and gains defense
    Given a player with base defense 2
    And leather leggings in the player inventory
    When the player equips the leather leggings
    Then the player defense power should be 3
    And the leather leggings should be the equipped legs

  Scenario: Player equips leather gauntlets and gains defense
    Given a player with base defense 2
    And leather gauntlets in the player inventory
    When the player equips the leather gauntlets
    Then the player defense power should be 3
    And the leather gauntlets should be the equipped arms

  Scenario: Player equips leather boots and gains defense
    Given a player with base defense 2
    And leather boots in the player inventory
    When the player equips the leather boots
    Then the player defense power should be 3
    And the leather boots should be the equipped boots

  Scenario: Player equips an iron ring into the first ring slot
    Given a player with base attack 5
    And an iron ring in the player inventory
    When the player equips the iron ring
    Then the player attack power should be 6
    And the iron ring should be in ring slot 1

  Scenario: Player equips a second iron ring into the second ring slot
    Given a player with base attack 5
    And an iron ring already equipped in slot 1
    And an iron ring in the player inventory
    When the player equips the iron ring
    Then the iron ring should be in ring slot 2

  Scenario: Player equips a stone amulet and gains defense
    Given a player with base defense 2
    And a stone amulet in the player inventory
    When the player equips the stone amulet
    Then the player defense power should be 4
    And the stone amulet should be the equipped amulet

  Scenario: Using a home seeking scroll returns a return-to-town message
    Given a player with base attack 5
    And a home seeking scroll in the player inventory
    When the player uses the home seeking scroll
    Then the use result should mention returning to town
