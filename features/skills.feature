Feature: Character Skills

  # ── SkillSystem ──────────────────────────────────────────────────────────

  Scenario: Character starts with Lucky Strike as the only active skill
    Given a new skill system
    Then the skill system has 1 active skill
    And the skill "Lucky Strike" is active

  Scenario: Lucky Strike has a 1% trigger chance and 1.5x damage multiplier
    Given a new skill system
    Then the Lucky Strike skill has a 1% trigger chance
    And the Lucky Strike skill has a 1.5x damage multiplier

  Scenario: Lucky Strike triggers and boosts damage when the chance roll succeeds
    Given a skill system where Lucky Strike always triggers
    When the skill system processes a hit of 10 damage
    Then the resulting skill damage is 15
    And the skill message "Lucky Strike! (+5 damage)" is returned

  Scenario: Lucky Strike does not trigger when the chance roll fails
    Given a skill system where Lucky Strike never triggers
    When the skill system processes a hit of 10 damage
    Then the resulting skill damage is 10
    And no skill messages are returned

  # ── CombatSystem integration ─────────────────────────────────────────────

  Scenario: Lucky Strike boosts combat damage when it triggers during an attack
    Given a skill system where Lucky Strike always triggers
    When the player attacks an enemy for 10 base damage using the skill system
    Then the combat damage is 15
    And the combat result includes skill message "Lucky Strike! (+5 damage)"

  Scenario: Combat without a skill system returns no skill messages
    When the player attacks an enemy for 10 base damage without a skill system
    Then the combat damage is 10
    And the combat result has no skill messages

  # ── SkillsToggle ─────────────────────────────────────────────────────────

  Scenario: Opening the skills panel from player input state
    Given the turn state is "PLAYER_INPUT"
    When the skills toggle is applied
    Then the turn state should become "SKILLS"
    And the skills toggle should return true

  Scenario: Closing the skills panel from skills state
    Given the turn state is "SKILLS"
    When the skills toggle is applied
    Then the turn state should become "PLAYER_INPUT"
    And the skills toggle should return true

  Scenario: Skills toggle is blocked when the player is acting
    Given the turn state is "PLAYER_ACTING"
    When the skills toggle is applied
    Then the turn state should remain "PLAYER_ACTING"
    And the skills toggle should return false
