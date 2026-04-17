Feature: Additional equipment slots

  Players can equip items to helmet, chest, legs, arms, boots, ring (×2),
  and amulet slots in addition to the existing weapon, shield, and ranged
  weapon slots.  All equipped items contribute their defence and attack
  bonuses to the player's total combat stats.

  # ── New slot existence ────────────────────────────────────────────────────────

  Scenario: Player has a helmet slot (starts empty)
    Given a new player for slot testing
    Then the player helmet slot is empty

  Scenario: Player has a chest slot (starts empty)
    Given a new player for slot testing
    Then the player chest slot is empty

  Scenario: Player has a legs slot (starts empty)
    Given a new player for slot testing
    Then the player legs slot is empty

  Scenario: Player has an arms slot (starts empty)
    Given a new player for slot testing
    Then the player arms slot is empty

  Scenario: Player has a boots slot (starts empty)
    Given a new player for slot testing
    Then the player boots slot is empty

  Scenario: Player has a ring 1 slot (starts empty)
    Given a new player for slot testing
    Then the player ring1 slot is empty

  Scenario: Player has a ring 2 slot (starts empty)
    Given a new player for slot testing
    Then the player ring2 slot is empty

  Scenario: Player has an amulet slot (starts empty)
    Given a new player for slot testing
    Then the player amulet slot is empty

  # ── Defence power aggregation ─────────────────────────────────────────────────

  Scenario: Helmet defence bonus contributes to defence power
    Given a new player for slot testing
    When a leather cap is equipped on the slot test player
    Then the slot test player defence power is 3

  Scenario: All armour slot bonuses stack in defence power
    Given a new player for slot testing
    When a leather cap is equipped on the slot test player
    And a leather chestpiece is equipped on the slot test player
    And leather leggings are equipped on the slot test player
    And leather gauntlets are equipped on the slot test player
    And leather boots are equipped on the slot test player
    Then the slot test player defence power is 8

  # ── Attack and defence power from accessories ─────────────────────────────────

  Scenario: Ring attack bonus contributes to attack power
    Given a new player for slot testing
    When an iron ring is equipped on the slot test player
    Then the slot test player attack power is 6

  Scenario: Amulet defence bonus contributes to defence power
    Given a new player for slot testing
    When a jade amulet is equipped on the slot test player
    Then the slot test player defence power is 5

  # ── Items equip to correct slots ──────────────────────────────────────────────

  Scenario: Leather Cap equips to helmet slot
    Given a new player for slot testing
    When a leather cap is equipped on the slot test player
    Then the slot test player helmet slot contains "Leather Cap"

  Scenario: Leather Chestpiece equips to chest slot
    Given a new player for slot testing
    When a leather chestpiece is equipped on the slot test player
    Then the slot test player chest slot contains "Leather Chestpiece"

  Scenario: Leather Leggings equip to legs slot
    Given a new player for slot testing
    When leather leggings are equipped on the slot test player
    Then the slot test player legs slot contains "Leather Leggings"

  Scenario: Leather Gauntlets equip to arms slot
    Given a new player for slot testing
    When leather gauntlets are equipped on the slot test player
    Then the slot test player arms slot contains "Leather Gauntlets"

  Scenario: Leather Boots equip to boots slot
    Given a new player for slot testing
    When leather boots are equipped on the slot test player
    Then the slot test player boots slot contains "Leather Boots"

  Scenario: Iron Ring equips to ring 1 slot when empty
    Given a new player for slot testing
    When an iron ring is equipped on the slot test player
    Then the slot test player ring1 slot contains "Iron Ring"

  Scenario: Second ring equips to ring 2 slot when ring 1 is occupied
    Given a new player for slot testing
    When an iron ring is equipped on the slot test player
    And an iron ring is equipped on the slot test player
    Then the slot test player ring2 slot contains "Iron Ring"

  Scenario: Stone Amulet equips to amulet slot
    Given a new player for slot testing
    When a stone amulet is equipped on the slot test player
    Then the slot test player amulet slot contains "Stone Amulet"

  # ── Loot floor restrictions ───────────────────────────────────────────────────

  Scenario: Leather Cap is in the loot pool from floor 10
    Given the item loot pool for floor 10
    Then "leather_cap" is in the item loot pool

  Scenario: Leather Cap is not in the loot pool before floor 10
    Given the item loot pool for floor 9
    Then "leather_cap" is not in the item loot pool

  Scenario: Leather Chestpiece is in the loot pool from floor 20
    Given the item loot pool for floor 20
    Then "leather_chestpiece" is in the item loot pool

  Scenario: Leather Chestpiece is not in the loot pool before floor 20
    Given the item loot pool for floor 19
    Then "leather_chestpiece" is not in the item loot pool

  Scenario: Leather Boots are in the loot pool from floor 1
    Given the item loot pool for floor 1
    Then "leather_boots" is in the item loot pool

  Scenario: Iron Ring is in the loot pool from floor 30
    Given the item loot pool for floor 30
    Then "iron_ring" is in the item loot pool

  Scenario: Iron Ring is not in the loot pool before floor 30
    Given the item loot pool for floor 29
    Then "iron_ring" is not in the item loot pool

  Scenario: Stone Amulet is in the loot pool from floor 30
    Given the item loot pool for floor 30
    Then "stone_amulet" is in the item loot pool
