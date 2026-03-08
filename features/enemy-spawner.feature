Feature: Enemy spawner
  As a developer I want enemy spawning handled by a dedicated EnemySpawner
  class so that spawn logic is testable and decoupled from the game scene.

  # ── getSpawnTable override ──────────────────────────────────────────────

  Scenario: getSpawnTable uses floor defaults when no weight override is given
    When the spawn table is requested for floor 1 with no weight override
    Then the result should contain 3 goblins and 0 orcs

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
