Feature: Run Stats Screen

  The in-game menu has a STATS button that opens a read-only stats screen
  showing the current run's statistics: summary figures, kills per enemy
  type, and consumables used per item id.

  # ── RunStatsFormatter ─────────────────────────────────────────────────────────

  Scenario: Summary section contains all four summary fields
    Given run stats with deepest floor 5, walls broken 3, gold gained 120, gold spent 45
    When the stats are formatted
    Then the summary contains a row with label "Deepest Floor" and value "5"
    And the summary contains a row with label "Walls Broken" and value "3"
    And the summary contains a row with label "Gold Gained" and value "120"
    And the summary contains a row with label "Gold Spent" and value "45"

  Scenario: Kill rows use the enemy's display name
    Given run stats with 5 goblin kills and 2 skeleton kills
    When the stats are formatted
    Then the kills section contains a row with label "Goblin" and value "5"
    And the kills section contains a row with label "Skeleton" and value "2"

  Scenario: Kills are sorted by count descending
    Given run stats with 2 goblin kills and 5 orc kills
    When the stats are formatted
    Then the kills section row 0 has label "Orc" and value "5"
    And the kills section row 1 has label "Goblin" and value "2"

  Scenario: Unknown enemy type falls back to title-case
    Given run stats with 1 kill of type "mystery_beast"
    When the stats are formatted
    Then the kills section contains a row with label "Mystery Beast" and value "1"

  Scenario: Empty kills map shows a placeholder row
    Given run stats with no kills
    When the stats are formatted
    Then the kills section contains a row with label "No kills yet" and value ""

  Scenario: Consumable rows use the item's display name
    Given run stats with 3 uses of "health_potion" and 2 uses of "home_seeking_scroll"
    When the stats are formatted
    Then the consumables section contains a row with label "Health Potion" and value "3"
    And the consumables section contains a row with label "Home Seeking Scroll" and value "2"

  Scenario: Consumables are sorted by count descending
    Given run stats with 1 uses of "health_potion" and 4 uses of "antidote"
    When the stats are formatted
    Then the consumables section row 0 has label "Antidote" and value "4"
    And the consumables section row 1 has label "Health Potion" and value "1"

  Scenario: Empty consumables map shows a placeholder row
    Given run stats with no consumables used
    When the stats are formatted
    Then the consumables section contains a row with label "No consumables used" and value ""
