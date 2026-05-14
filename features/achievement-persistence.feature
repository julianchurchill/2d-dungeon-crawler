Feature: Achievement Persistence

  Achievements are scoped to a single game run and persisted in localStorage so
  that progress survives a page refresh mid-run.  Starting a new game resets all
  achievement progress.

  Scenario: Achievement progress is saved to storage when updated
    Given an empty achievement store with a fake storage
    When progress is incremented for "cockroach_killer"
    Then the storage should contain the serialised achievement state

  Scenario: Achievement store loads previously saved progress from storage
    Given a fake storage containing saved achievement progress for "cockroach_killer" with count 3
    When the achievement store is loaded from storage
    Then the achievement store should have count 3 for "cockroach_killer"

  Scenario: Resetting the achievement store clears storage
    Given an empty achievement store with a fake storage
    When progress is incremented for "cockroach_killer"
    And the achievement store is reset
    Then the storage entry should be empty

  # ── Security: unknown key rejection ──────────────────────────────────────

  Scenario: Loading achievement store with an unknown key does not add it to the store
    Given a fake storage containing crafted achievement data with unknown key "evil_key"
    When the achievement store is loaded from storage
    Then the achievement store should not contain key "evil_key"

  Scenario: Loading achievement store with __proto__ does not pollute Object prototype
    Given a fake storage containing crafted achievement data with unknown key "__proto__"
    When the achievement store is loaded from storage
    Then Object.prototype should not have been polluted by the load
