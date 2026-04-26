Feature: Stat Distribution on Level Up

  When a player levels up they receive 2 stat points to freely distribute
  between attack and defense. HP still increases automatically. Attack no
  longer increases automatically — that point must now be spent by the player.

  # ── levelUp stat points ──────────────────────────────────────────────────────

  Scenario: Leveling up awards 2 stat points
    Given a new player
    When the player levels up
    Then the player has 2 stat points to distribute

  Scenario: Leveling up does not automatically increase attack
    Given a new player
    When the player levels up
    Then the player attack stat is unchanged at 5

  Scenario: Leveling up still increases max HP by 5
    Given a new player
    When the player levels up
    Then the player max HP is 35

  Scenario: Leveling up still restores up to 5 HP
    Given a new player at full HP
    When the player levels up
    Then the player HP is 35

  # ── applyStatPoint ───────────────────────────────────────────────────────────

  Scenario: Spending a stat point on attack increases attack by 1
    Given a player with 2 stat points
    When the player applies a stat point to attack
    Then the player attack stat is 6
    And the player has 1 stat point remaining

  Scenario: Spending a stat point on defense increases defense by 1
    Given a player with 2 stat points
    When the player applies a stat point to defense
    Then the player defense stat is 3
    And the player has 1 stat point remaining

  Scenario: Cannot spend stat points when none remain
    Given a player with 0 stat points
    When the player applies a stat point to attack
    Then the player attack stat is 5
    And the player has 0 stat points remaining

  Scenario: Both points can be spent on the same stat
    Given a player with 2 stat points
    When the player applies a stat point to attack
    And the player applies a stat point to attack
    Then the player attack stat is 7
    And the player has 0 stat points remaining

  Scenario: Points can be split between attack and defense
    Given a player with 2 stat points
    When the player applies a stat point to attack
    And the player applies a stat point to defense
    Then the player attack stat is 6
    And the player defense stat is 3
    And the player has 0 stat points remaining

  # ── gainXP integration ───────────────────────────────────────────────────────

  Scenario: gainXP triggers a level up and awards stat points
    Given a player with 19 XP needing 20 to level
    When the player gains 1 XP
    Then the player has 2 stat points to distribute
