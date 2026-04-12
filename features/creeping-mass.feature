Feature: Creeping Mass enemy

  # ── Construction ─────────────────────────────────────────────────────────────

  Scenario: Creeping Mass is constructed with 3 segments
    Given a Creeping Mass with 3 segments starting at 5, 5
    Then the mass has 3 segments
    And the mass hp equals 3 times the hp per segment
    And the mass max hp equals 3 times the hp per segment

  Scenario: Creeping Mass is constructed with 5 segments
    Given a Creeping Mass with 5 segments starting at 5, 5
    Then the mass has 5 segments
    And the mass hp equals 5 times the hp per segment

  Scenario: All segments are horizontally or vertically connected
    Given a Creeping Mass with 4 segments starting at 5, 5
    Then every segment is adjacent to at least one other segment

  Scenario: Creeping Mass has the correct enemy type
    Given a Creeping Mass with 3 segments starting at 5, 5
    Then the mass type is "creeping_mass"
    And the mass name is "Creeping Mass"

  # ── isDead ────────────────────────────────────────────────────────────────────

  Scenario: Creeping Mass is not dead when hp is above zero
    Given a Creeping Mass with 3 segments starting at 5, 5
    Then the mass is not dead

  Scenario: Creeping Mass is dead when hp reaches zero
    Given a Creeping Mass with 3 segments starting at 5, 5
    When the mass takes 9999 damage
    Then the mass is dead

  # ── Segment loss ─────────────────────────────────────────────────────────────

  Scenario: Losing a segment when hp drops below two-thirds
    Given a Creeping Mass with 3 segments starting at 5, 5
    When the mass takes enough damage to leave 2 segments worth of hp
    Then the mass has 2 segments

  Scenario: Losing two segments when hp drops to one-third
    Given a Creeping Mass with 3 segments starting at 5, 5
    When the mass takes enough damage to leave 1 segment worth of hp
    Then the mass has 1 segment

  Scenario: Removed segments are recorded for cleanup
    Given a Creeping Mass with 3 segments starting at 5, 5
    When the mass takes enough damage to leave 2 segments worth of hp
    Then there is 1 pending removed segment

  Scenario: Segments remain connected after losing one
    Given a Creeping Mass with 4 segments starting at 5, 5
    When the mass takes enough damage to leave 3 segments worth of hp
    Then every segment is adjacent to at least one other segment

  # ── Combat ───────────────────────────────────────────────────────────────────

  Scenario: Creeping Mass attacks when any segment is adjacent to the player
    Given a Creeping Mass with 3 segments starting at 5, 5
    And a mass target player at position 4, 5
    When the mass takes its turn on an open map
    Then the mass action is "attack"
    And the mass attack target is the player

  Scenario: Creeping Mass does not attack when no segment is adjacent to the player
    Given a Creeping Mass with 3 segments starting at 5, 5
    And a mass target player at position 0, 0
    When the mass takes its turn on an open map with wander suppressed
    Then the mass action is not "attack"

  # ── Movement ─────────────────────────────────────────────────────────────────

  Scenario: Creeping Mass moves toward player when within aggro range
    Given a Creeping Mass with 3 segments starting at 5, 5
    And a mass target player at position 5, 0
    When the mass takes its turn on an open map
    Then the mass action is "creeping_move"

  Scenario: Moved segment is removed from its old position
    Given a Creeping Mass with 3 segments starting at 5, 5
    And a mass target player at position 5, 0
    When the mass takes its turn on an open map
    Then the remove segment is different from the add segment

  Scenario: Creeping Mass idles when player is outside aggro range
    Given a Creeping Mass with 3 segments starting at 5, 5
    And a mass target player at position 50, 50
    When the mass takes its turn on an open map with wander suppressed
    Then the mass action is "idle"

  Scenario: Creeping Mass idles when all expansion tiles are blocked
    Given a Creeping Mass with 3 segments starting at 5, 5
    And a mass target player at position 5, 0
    When the mass takes its turn on a fully blocked map
    Then the mass action is "idle"

  # ── Spawn table ──────────────────────────────────────────────────────────────

  Scenario: Creeping Mass does not appear before floor 10
    Given the spawn table for floor 9
    Then "creeping_mass" is not in the spawn table

  Scenario: Creeping Mass appears from floor 10
    Given the spawn table for floor 10
    Then "creeping_mass" is in the spawn table
