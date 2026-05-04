Feature: Global Stats Tracking

  Global statistics accumulate across all save slots and all past runs,
  persisting in a dedicated localStorage entry that is never reset between
  games.  They mirror the per-run stats plus a boss kill count per boss type.

  # ── Initial state ─────────────────────────────────────────────────────────────

  Scenario: Fresh global stats have all counters at zero
    Given an empty global stats storage
    When the global stats are loaded
    Then the global deepest floor is 1
    And the global walls broken is 0
    And the global gold gained is 0
    And the global gold spent is 0
    And the global kills map is empty
    And the global consumables map is empty
    And the global boss kills map is empty

  # ── Floor ─────────────────────────────────────────────────────────────────────

  Scenario: Recording a deeper floor updates deepest floor
    Given an empty global stats storage
    When the global floor 8 is recorded
    Then the global deepest floor is 8

  Scenario: Recording a shallower floor does not reduce deepest floor
    Given an empty global stats storage
    When the global floor 8 is recorded
    And the global floor 3 is recorded
    Then the global deepest floor is 8

  # ── Kills ──────────────────────────────────────────────────────────────────────

  Scenario: Kills accumulate across multiple recordings
    Given an empty global stats storage
    When a global kill of type "goblin" is recorded
    And a global kill of type "goblin" is recorded
    And a global kill of type "goblin" is recorded
    Then the global kill count for "goblin" is 3

  Scenario: Kills of different types are tracked independently
    Given an empty global stats storage
    When a global kill of type "goblin" is recorded
    And a global kill of type "orc" is recorded
    Then the global kill count for "goblin" is 1
    And the global kill count for "orc" is 1

  # ── Boss kills ────────────────────────────────────────────────────────────────

  Scenario: Killing a boss records a kill count of one
    Given an empty global stats storage
    When a global boss kill of type "old_bones" is recorded
    Then the global boss kill count for "old_bones" is 1

  Scenario: Killing the same boss type twice increments the count
    Given an empty global stats storage
    When a global boss kill of type "old_bones" is recorded
    And a global boss kill of type "old_bones" is recorded
    Then the global boss kill count for "old_bones" is 2

  Scenario: Different boss types are tracked independently
    Given an empty global stats storage
    When a global boss kill of type "old_bones" is recorded
    And a global boss kill of type "dragon" is recorded
    Then the global boss kill count for "old_bones" is 1
    And the global boss kill count for "dragon" is 1

  # ── Consumables ────────────────────────────────────────────────────────────────

  Scenario: Consumable usage accumulates
    Given an empty global stats storage
    When a global consumable "health_potion" use is recorded
    And a global consumable "health_potion" use is recorded
    Then the global consumable count for "health_potion" is 2

  # ── Walls ──────────────────────────────────────────────────────────────────────

  Scenario: Wall breaks accumulate
    Given an empty global stats storage
    When a global wall broken is recorded
    And a global wall broken is recorded
    Then the global walls broken is 2

  # ── Gold ───────────────────────────────────────────────────────────────────────

  Scenario: Gold gained accumulates
    Given an empty global stats storage
    When 75 global gold gained is recorded
    And 25 global gold gained is recorded
    Then the global gold gained is 100

  Scenario: Gold spent accumulates
    Given an empty global stats storage
    When 40 global gold spent is recorded
    Then the global gold spent is 40

  # ── Persistence ────────────────────────────────────────────────────────────────

  Scenario: Global stats survive a save and reload cycle
    Given an empty global stats storage
    When a global kill of type "goblin" is recorded
    And a global boss kill of type "old_bones" is recorded
    And 50 global gold gained is recorded
    And the global stats are reloaded
    Then the global kill count for "goblin" is 1
    And the global boss kill count for "old_bones" is 1
    And the global gold gained is 50

  # ── Formatter ──────────────────────────────────────────────────────────────────

  Scenario: Formatted global stats include a boss kills section with counts
    Given global stats with 2 boss kills of type "old_bones"
    When the global stats are formatted
    Then the unique bosses section shows "Old Bones" with count 2

  Scenario: Empty boss kills section shows a placeholder
    Given global stats with no bosses killed
    When the global stats are formatted
    Then the unique bosses section contains "No bosses killed yet"
