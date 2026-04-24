Feature: Achievements screen display list
  As a player I want to view all achievements and their progress
  so that I can see what I have completed and what remains to unlock.

  Scenario: Display list contains an entry for every achievement
    Given the achievement system is initialised
    When the achievements display list is retrieved
    Then the display list should contain 33 entries

  Scenario: An incomplete achievement entry shows progress text
    Given the achievement system is initialised
    When the player kills 4 goblins
    And the achievements display list is retrieved
    Then the "goblin_killer" entry should show "(4 killed so far)"
    And the "goblin_killer" entry should not be marked as completed

  Scenario: A completed achievement entry is marked as completed
    Given the achievement system is initialised
    When the player kills 10 goblins
    And the achievements display list is retrieved
    Then the "goblin_killer" entry should be marked as completed
    And the "goblin_killer" entry should not show "so far"

  Scenario: An achievement that grants an unlock carries the unlocks field
    Given the achievement system is initialised
    When the achievements display list is retrieved
    Then the "goblin_killer" entry should have unlocks "Goblin Hunting skill"

  Scenario: An achievement that grants Night Vision carries the unlocks field
    Given the achievement system is initialised
    When the achievements display list is retrieved
    Then the "burrower" entry should have unlocks "Night Vision skill"

  Scenario: Orc Killer achievement carries the unlocks field
    Given the achievement system is initialised
    When the achievements display list is retrieved
    Then the "orc_killer" entry should have unlocks "Orc Hunting skill"

  Scenario: Troll Killer achievement carries the unlocks field
    Given the achievement system is initialised
    When the achievements display list is retrieved
    Then the "troll_killer" entry should have unlocks "Troll Hunting skill"

  Scenario: Cockroach Killer achievement carries the unlocks field
    Given the achievement system is initialised
    When the achievements display list is retrieved
    Then the "cockroach_killer" entry should have unlocks "Cockroach Hunting skill"

  Scenario: Sprite Stalker achievement carries the unlocks field
    Given the achievement system is initialised
    When the achievements display list is retrieved
    Then the "sprite_stalker" entry should have unlocks "Potion of Minor Teleportation"

  Scenario: Sprite Killer achievement carries the unlocks field
    Given the achievement system is initialised
    When the achievements display list is retrieved
    Then the "sprite_killer" entry should have unlocks "Sprite Hunting skill"
