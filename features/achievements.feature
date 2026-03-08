Feature: Achievement system
  As a player I want to earn achievements as I explore the dungeon
  so that my progress and accomplishments are recognised.

  Scenario: Progress is tracked for a kill-type achievement
    Given the achievement system is initialised
    When the player kills a goblin
    Then the Goblin Killer achievement progress should be 1

  Scenario: Achievement is unlocked when the kill count reaches the target
    Given the achievement system is initialised
    When the player kills 10 goblins
    Then the Goblin Killer achievement should be completed

  Scenario: A completed achievement is not completed a second time
    Given the Goblin Killer achievement has already been completed
    When the player kills another goblin
    Then the Goblin Killer achievement completion count should still be 1

  Scenario: Progress text is shown for an incomplete counting achievement
    Given the achievement system is initialised
    When the player kills 4 goblins
    Then the Goblin Killer progress text should include "(4 killed so far)"

  Scenario: Progress text is not shown for a completed achievement
    Given the achievement system is initialised
    When the player kills 10 goblins
    Then the Goblin Killer progress text should not include "so far"

  Scenario: Floor-reached achievement is unlocked when target floor is reached
    Given the achievement system is initialised
    When the player reaches dungeon floor 10
    Then the Burrower achievement should be completed

  Scenario: Floor-reached achievement is not unlocked before the target floor
    Given the achievement system is initialised
    When the player reaches dungeon floor 5
    Then the Burrower achievement should not be completed

  Scenario: Floor progress text shows floors reached so far
    Given the achievement system is initialised
    When the player reaches dungeon floor 5
    Then the Burrower progress text should include "(5 reached so far)"

  Scenario: Orc Slayer is unlocked when 10 orcs are killed
    Given the achievement system is initialised
    When the player kills 10 orcs
    Then the "Orc Killer" achievement should be completed

  Scenario: Troll Hunter is unlocked when 10 trolls are killed
    Given the achievement system is initialised
    When the player kills 10 trolls
    Then the "Troll Killer" achievement should be completed

  Scenario: A floor milestone achievement is unlocked when the target floor is reached
    Given the achievement system is initialised
    When the player reaches dungeon floor 50
    Then the "Abyssal Explorer" achievement should be completed

  Scenario: A level milestone achievement is unlocked when the target level is reached
    Given the achievement system is initialised
    When the player reaches level 10
    Then the "Apprentice" achievement should be completed
