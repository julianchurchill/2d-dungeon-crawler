Feature: FloorBuilder

  FloorBuilder is responsible for all floor-construction logic extracted from
  GameScene: building the tilemap, spawning enemies, items, NPCs, and unique
  rooms. It accepts a scene reference and exposes each operation as a named
  method.

  Scenario: FloorBuilder exposes the expected floor-building methods
    Given a FloorBuilder bound to a minimal scene context
    Then the builder exposes buildTilemap
    And the builder exposes spawnEnemies
    And the builder exposes spawnChallengeArena
    And the builder exposes spawnDevBosses
    And the builder exposes spawnDevChampions
    And the builder exposes trySpawnOldBones
    And the builder exposes spawnItems
    And the builder exposes spawnHiddenRoomItems
    And the builder exposes trySpawnUniqueRoom
    And the builder exposes spawnNpcs
