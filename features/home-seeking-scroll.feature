Feature: Home Seeking Scroll

  The Home Seeking Scroll is a rare consumable item that teleports the player
  instantly to town. Using it places a RECALL_PORTAL tile in town; stepping on
  the portal returns the player to the exact dungeon floor and position they
  left from, with all floor state preserved (enemies, items, map).

  # ── Item definition ─────────────────────────────────────────────────────────

  Scenario: Home Seeking Scroll item type is defined as a consumable
    Given the Home Seeking Scroll item type
    Then it is a consumable item
    And it has a teleport_to_town effect

  Scenario: Home Seeking Scroll has a sell price
    Given the Home Seeking Scroll item type
    Then its sell price is greater than 0

  # ── Loot pool ────────────────────────────────────────────────────────────────

  Scenario: Home Seeking Scroll is in the floor loot pool from floor 1
    When getFloorLootPool is called for floor 1
    Then the home seeking scroll is in the loot pool

  Scenario: Home Seeking Scroll spawns less often than health potions
    When getFloorLootPool is sampled 300 times on floor 1
    Then the home seeking scroll appears less often than the health potion

  # ── Magic shop stock ─────────────────────────────────────────────────────────

  Scenario: Magic shop always stocks one Home Seeking Scroll
    When magic shop stock is generated for a level 1 player
    Then the stock includes exactly one Home Seeking Scroll

  Scenario: Magic shop still stocks health potions
    When magic shop stock is generated for a level 1 player
    Then the stock includes at least one Health Potion

  # ── Shop name ────────────────────────────────────────────────────────────────

  Scenario: The potion shop is now named Magic Shop
    When the shop name for type 'potion' is looked up
    Then the shop name is 'Magic Shop'

  Scenario: Weapon and armour shop names are unchanged
    When the shop name for type 'weapon' is looked up
    Then the shop name is 'Weapon Shop'
    When the shop name for type 'armour' is looked up
    Then the shop name is 'Armour Shop'

  # ── RECALL_PORTAL tile ───────────────────────────────────────────────────────

  Scenario: RECALL_PORTAL tile is defined
    Then the RECALL_PORTAL tile value is defined

  Scenario: RECALL_PORTAL tile is walkable
    Given a dungeon map with a RECALL_PORTAL tile at position 5 5
    Then the tile at 5 5 is walkable

  Scenario: RECALL_PORTAL tile is not opaque
    Given a dungeon map with a RECALL_PORTAL tile at position 5 5
    Then the tile at 5 5 is not opaque

  # ── DungeonSnapshot ──────────────────────────────────────────────────────────

  Scenario: DungeonSnapshot records the floor number
    Given a dungeon snapshot created at floor 3 position 7 8
    Then the snapshot floor is 3

  Scenario: DungeonSnapshot records the return position
    Given a dungeon snapshot created at floor 3 position 7 8
    Then the snapshot return position is 7 8

  Scenario: DungeonSnapshot records live enemies
    Given a dungeon snapshot created with 2 enemies
    Then the snapshot enemy count is 2

  Scenario: DungeonSnapshot records floor items
    Given a dungeon snapshot created with 3 items
    Then the snapshot item count is 3
