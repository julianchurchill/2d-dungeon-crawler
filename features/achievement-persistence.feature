Feature: Achievement Persistence

  Achievements are scoped to a single game run and persisted in localStorage so
  that progress survives a page refresh mid-run.  Starting a new game resets all
  achievement progress.

  Scenario: Achievement progress is saved to storage when updated
    Given an empty achievement store with a fake storage
    When progress is incremented for "veteran_slayer"
    Then the storage should contain the serialised achievement state

  Scenario: Achievement store loads previously saved progress from storage
    Given a fake storage containing saved achievement progress for "veteran_slayer" with count 3
    When the achievement store is loaded from storage
    Then the achievement store should have count 3 for "veteran_slayer"

  Scenario: Resetting the achievement store clears storage
    Given an empty achievement store with a fake storage
    When progress is incremented for "veteran_slayer"
    And the achievement store is reset
    Then the storage entry should be empty
