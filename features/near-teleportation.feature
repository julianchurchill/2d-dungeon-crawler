Feature: Potion of Near Teleportation

  The Potion of Near Teleportation teleports the player to a random walkable,
  unoccupied tile that is within a minimum and maximum distance from them.
  It can teleport through walls — only the destination tile needs to be walkable.

  Scenario: Returns a destination within the allowed distance range
    Given a 20x20 open map with the player at position 5 5
    When findNearTeleportDestination is called with minDist 3 and maxDist 8
    Then a destination tile is returned
    And the destination is between 3 and 8 tiles from the player

  Scenario: Never returns a tile closer than the minimum distance
    Given a 20x20 open map with the player at position 10 10
    When findNearTeleportDestination is called with minDist 5 and maxDist 10
    Then the destination is at least 5 tiles from the player

  Scenario: Never returns the player's own tile
    Given a 20x20 open map with the player at position 5 5
    When findNearTeleportDestination is called with minDist 3 and maxDist 8
    Then the destination is not the player's starting position

  Scenario: Returns null when all tiles in range are walls
    Given a map where all tiles in range are walls with player at position 5 5
    When findNearTeleportDestination is called with minDist 1 and maxDist 3
    Then no destination is returned

  Scenario: Returns null when all tiles in range are occupied by entities
    Given a 20x20 open map where all tiles are occupied with player at position 5 5
    When findNearTeleportDestination is called with minDist 1 and maxDist 3
    Then no destination is returned

  Scenario: Only selects walkable unoccupied tiles
    Given a 20x20 open map with the player at position 5 5
    When findNearTeleportDestination is called with minDist 3 and maxDist 8
    Then the returned tile is walkable and unoccupied

  Scenario: Potion of Near Teleportation item type is a consumable
    Given the Potion of Near Teleportation item type
    Then it is a consumable item
    And it has a teleport_near effect

  Scenario: getFloorLoot includes Potion of Near Teleportation when unlocked
    Given the sprite_stalker achievement is unlocked
    When getFloorLoot is called for floor 1
    Then the potion of near teleportation is in the loot pool

  Scenario: getFloorLoot excludes Potion of Near Teleportation when not unlocked
    Given the sprite_stalker achievement is not unlocked
    When getFloorLoot is called for floor 1
    Then the potion of near teleportation is not in the loot pool
