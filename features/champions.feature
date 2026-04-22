Feature: Champion enemies
  Some normal enemy types occasionally spawn as champions — tougher variants
  with enhanced stats, more XP, and an item drop on death.

  # ── Champion stats ────────────────────────────────────────────────────────

  Scenario: A champion has greater HP than the base enemy
    Given a goblin champion created on floor 5
    Then the champion HP should be greater than the base goblin HP

  Scenario: A champion has greater attack than the base enemy
    Given a goblin champion created on floor 5
    Then the champion attack should be greater than the base goblin attack

  Scenario: A champion has greater defense than the base enemy
    Given a goblin champion created on floor 5
    Then the champion defense should be greater than the base goblin defense

  Scenario: A champion awards more XP than the base enemy
    Given a goblin champion created on floor 5
    Then the champion XP should be greater than the base goblin XP

  # ── Champion identity ─────────────────────────────────────────────────────

  Scenario: A champion name includes the word Champion
    Given a goblin champion created on floor 5
    Then the champion name should contain 'Champion'

  Scenario: A champion has the isChampion flag set to true
    Given a goblin champion created on floor 5
    Then the enemy should have isChampion set to true

  # ── Champion loot ─────────────────────────────────────────────────────────

  Scenario: A champion has a drop item assigned
    Given a goblin champion created on floor 5
    Then the champion should have a drop item

  Scenario: The champion drop item belongs to the loot pool for floors 5 to 10
    Given a goblin champion created on floor 5
    Then the champion drop item should belong to the loot pool for floors 5 to 10

  # ── EnemySpawner integration ──────────────────────────────────────────────

  Scenario: EnemySpawner marks an enemy as a champion when champion chance fires
    Given an EnemySpawner with a guaranteed champion chance and goblin-only weights
    When spawning enemies for 2 rooms on floor 1 with champion tracking
    Then a champion should have been spawned

  Scenario: Solitary enemies are never spawned as champions
    Given an EnemySpawner with a guaranteed champion chance and creeping_mass-only weights
    When spawning enemies for 2 rooms on floor 10 with champion tracking
    Then no champion should have been spawned
