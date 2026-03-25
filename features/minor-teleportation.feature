Feature: Potion of Minor Teleportation

  The Potion of Minor Teleportation teleports the player to a random walkable,
  unoccupied tile that is within a minimum and maximum distance from them.
  It can teleport through walls — only the destination tile needs to be walkable.

  Scenario: Returns a destination within the allowed distance range
    Given a 20x20 open map with the player at position 5 5
    When findMinorTeleportDestination is called with minDist 3 and maxDist 8
    Then a destination tile is returned
    And the destination is between 3 and 8 tiles from the player

  Scenario: Never returns a tile closer than the minimum distance
    Given a 20x20 open map with the player at position 10 10
    When findMinorTeleportDestination is called with minDist 5 and maxDist 10
    Then the destination is at least 5 tiles from the player

  Scenario: Never returns the player's own tile
    Given a 20x20 open map with the player at position 5 5
    When findMinorTeleportDestination is called with minDist 3 and maxDist 8
    Then the destination is not the player's starting position

  Scenario: Returns null when all tiles in range are walls
    Given a map where all tiles in range are walls with player at position 5 5
    When findMinorTeleportDestination is called with minDist 1 and maxDist 3
    Then no destination is returned

  Scenario: Returns null when all tiles in range are occupied by entities
    Given a 20x20 open map where all tiles are occupied with player at position 5 5
    When findMinorTeleportDestination is called with minDist 1 and maxDist 3
    Then no destination is returned

  Scenario: Only selects walkable unoccupied tiles
    Given a 20x20 open map with the player at position 5 5
    When findMinorTeleportDestination is called with minDist 3 and maxDist 8
    Then the returned tile is walkable and unoccupied

  Scenario: Potion of Minor Teleportation item type is a consumable
    Given the Potion of Minor Teleportation item type
    Then it is a consumable item
    And it has a teleport_near effect

  Scenario: item.use() teleports the player when a destination is available
    Given a 20x20 open map with the player at position 5 5
    And a Potion of Minor Teleportation item instance
    When the item is used with a teleport context
    Then the player position has changed
    And the use message mentions vanishing

  Scenario: item.use() returns a failure message when no destination is available
    Given a map where all tiles in range are walls with player at position 5 5
    And a Potion of Minor Teleportation item instance
    When the item is used with a teleport context
    Then the player position has not changed
    And the use message mentions nothing happening

  Scenario: getFloorLoot includes Potion of Minor Teleportation when unlocked
    Given the sprite_stalker achievement is unlocked
    When getFloorLoot is called for floor 1
    Then the potion of minor teleportation is in the loot pool

  Scenario: getFloorLoot excludes Potion of Minor Teleportation when not unlocked
    Given the sprite_stalker achievement is not unlocked
    When getFloorLoot is called for floor 1
    Then the potion of minor teleportation is not in the loot pool
