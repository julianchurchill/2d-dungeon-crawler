Feature: Dev-mode invincibility toggles

  In dev mode the player can toggle invincibility for enemies and/or the
  player during a run.  When enemies are invincible every attack against them
  deals zero damage and they cannot be killed.  When the player is invincible
  every attack against the player deals zero damage.

  # ── Enemy invincibility ──────────────────────────────────────────────────

  Scenario: Enemy takes full damage when invincibility is off
    Given enemy invincibility is off
    When the player attacks an enemy with base attack power 10
    Then the enemy takes damage greater than 0

  Scenario: Enemy takes no damage when invincibility is on
    Given enemy invincibility is on
    When the player attacks an enemy with base attack power 10
    Then the enemy takes no damage

  Scenario: Enemy cannot be killed when invincibility is on
    Given enemy invincibility is on
    When the player attacks an enemy with base attack power 10
    Then the enemy is not killed

  # ── Player invincibility ─────────────────────────────────────────────────

  Scenario: Player takes full damage when invincibility is off
    Given player invincibility is off
    When an enemy attacks the player with base attack power 10
    Then the player takes damage greater than 0

  Scenario: Player takes no damage when invincibility is on
    Given player invincibility is on
    When an enemy attacks the player with base attack power 10
    Then the player takes no damage

  Scenario: Player cannot be killed when invincibility is on
    Given player invincibility is on
    When an enemy attacks the player with base attack power 10
    Then the player is not killed
