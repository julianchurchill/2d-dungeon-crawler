Feature: Enemy spawner
  As a developer I want enemy spawning handled by a dedicated EnemySpawner
  class so that spawn logic is testable and decoupled from the game scene.

  # ── getSpawnTable override ──────────────────────────────────────────────

  Scenario: getSpawnTable uses floor defaults when no weight override is given
    When the spawn table is requested for floor 1 with no weight override
    Then the result should contain 1 goblins and 0 orcs
    And the result should contain 4 cockroaches and 3 sprites

  Scenario: getSpawnTable has reduced cockroaches and no sprites on higher floors
    When the spawn table is requested for floor 6 with no weight override
    Then the result should contain 1 cockroaches and 0 sprites

  Scenario: getSpawnTable applies weight override instead of floor defaults
    When the spawn table is requested for floor 5 with weights goblin 0 orc 1 troll 0
    Then the result should contain 0 goblins and 1 orc

  # ── EnemySpawner ─────────────────────────────────────────────────────────

  Scenario: EnemySpawner places no enemies when max enemies per room is 0
    Given an EnemySpawner with max enemies per room 0
    When spawning enemies for 3 rooms on floor 1
    Then no enemies should have been spawned

  Scenario: EnemySpawner never places enemies in the start room
    Given an EnemySpawner with max enemies per room 5 and a maximum RNG
    When spawning enemies for 1 room on floor 1
    Then no enemies should have been spawned

  Scenario: EnemySpawner places enemies in all non-start rooms
    Given an EnemySpawner with max enemies per room 1 and a maximum RNG
    When spawning enemies for 3 rooms on floor 1
    Then 2 enemies should have been spawned

  Scenario: EnemySpawner uses floor default max when maxEnemiesPerRoom is null
    Given an EnemySpawner with null max enemies per room and a maximum RNG
    When spawning enemies for 2 rooms on floor 2
    Then 2 enemies should have been spawned

  Scenario: EnemySpawner respects explicit minimum enemies per room
    Given an EnemySpawner with min 2 max 2 and a minimum RNG
    When spawning enemies for 2 rooms on floor 1
    Then 2 enemies should have been spawned

  Scenario: EnemySpawner spawns enemies at the maximum x and y position within a room
    Given an EnemySpawner with max enemies per room 1 and a maximum RNG
    When spawning enemies for 2 rooms on floor 1
    Then the first enemy should have been spawned at x 25 y 5

  Scenario: EnemySpawner spawns enemies at the minimum x and y position within a room
    Given an EnemySpawner with min 1 max 1 and a minimum RNG
    When spawning enemies for 2 rooms on floor 1
    Then the first enemy should have been spawned at x 21 y 1

  Scenario: EnemySpawner skips occupied tiles
    Given an EnemySpawner with max enemies per room 1 and a maximum RNG
    When spawning enemies for 2 rooms on floor 1 with all tiles occupied
    Then no enemies should have been spawned
