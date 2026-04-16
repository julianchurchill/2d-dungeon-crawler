Feature: Ranged Weapons

  Two basic ranged weapons — Short Bow and Hand Crossbow — can be found as
  dungeon floor loot and equipped in the player's dedicated ranged weapon slot.
  When equipped they add their attack bonus to the player's total attack power.

  # ── Item types ───────────────────────────────────────────────────────────────

  Scenario: Short bow is available as floor loot from floor 1
    Given no unlocked items
    When getFloorLoot is called for floor 1
    Then the short bow is in the loot pool

  Scenario: Hand crossbow is available as floor loot from floor 4
    Given no unlocked items
    When getFloorLoot is called for floor 4
    Then the hand crossbow is in the loot pool

  Scenario: Hand crossbow is not available as floor loot before floor 4
    Given no unlocked items
    When getFloorLoot is called for floor 3
    Then the hand crossbow is not in the loot pool

  # ── Player ranged weapon slot ─────────────────────────────────────────────────

  Scenario: Player has no ranged weapon equipped by default
    Given a player with an empty inventory
    Then the player has no ranged weapon equipped

  Scenario: Equipping a short bow sets the ranged weapon slot
    Given a player with an empty inventory
    And a short bow in the player inventory
    When the player equips the short bow
    Then the short bow should be the equipped ranged weapon

  Scenario: Short bow adds its attack bonus to the player's attack power
    Given a player with base attack 5
    And a short bow in the player inventory
    When the player equips the short bow
    Then the player attack power should be 7

  Scenario: Hand crossbow adds its attack bonus to the player's attack power
    Given a player with base attack 5
    And a hand crossbow in the player inventory
    When the player equips the hand crossbow
    Then the player attack power should be 9

  Scenario: Ranged weapon and melee weapon bonuses both count towards attack power
    Given a player with base attack 5
    And a short sword in the player inventory
    And a short bow in the player inventory
    When the player equips the short sword
    And the player equips the short bow
    Then the player attack power should be 10

  Scenario: Equipping a ranged weapon emits PLAYER_STATS_CHANGED with updated attack
    Given a player with base attack 5
    And a short bow in the player inventory
    When the player equips the short bow
    Then the PLAYER_STATS_CHANGED event should carry attack 7
