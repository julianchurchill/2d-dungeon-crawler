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

  # ── SkillSystem upgrade (dev mode) ──────────────────────────────────────────

  Scenario: Lucky Strike can be upgraded when below the max crit chance
    Given a new skill system
    Then Lucky Strike can be upgraded

  Scenario: Upgrading Lucky Strike increments its crit chance by 1%
    Given a new skill system
    When Lucky Strike is upgraded
    Then the Lucky Strike skill has a 2% trigger chance

  Scenario: Upgrading Lucky Strike updates its description to reflect the new chance
    Given a new skill system
    When Lucky Strike is upgraded
    Then the Lucky Strike skill description contains "2%"

  Scenario: upgradeSkill returns true when the skill is upgraded successfully
    Given a new skill system
    When Lucky Strike is upgraded
    Then the upgrade result is true

  Scenario: upgradeSkill returns false when the skill id is not found
    Given a new skill system
    When the skill "unknown_skill" is upgraded
    Then the upgrade result is false

  Scenario: upgradeSkill returns false when Lucky Strike is at the crit cap
    Given a skill system with Lucky Strike at the crit cap
    When Lucky Strike is upgraded
    Then the upgrade result is false

  Scenario: Lucky Strike cannot be upgraded when at the crit cap
    Given a skill system with Lucky Strike at the crit cap
    Then Lucky Strike cannot be upgraded

  Scenario: Lucky Strike crit chance stays at 50% after an upgrade attempt at the cap
    Given a skill system with Lucky Strike at the crit cap
    When Lucky Strike is upgraded
    Then the Lucky Strike skill has a 50% trigger chance

  Scenario: Skill system starts with Ferocity and Dodge as inactive skills
    Given a new skill system
    Then the inactive skills include "Ferocity"
    And the inactive skills include "Dodge"

  Scenario: Activating Ferocity moves it to active skills
    Given a new skill system
    When Ferocity is activated
    Then the skill "Ferocity" is active
    And the inactive skills do not include "Ferocity"

  # ── Ferocity skill ───────────────────────────────────────────────────────────

  Scenario: Ferocity adds its bonus to attack damage on hit
    Given a skill system with Ferocity active
    When the skill system processes a hit of 10 damage
    Then the resulting skill damage is 11

  Scenario: Ferocity produces no messages on hit
    Given a skill system with Ferocity active
    When the skill system processes a hit of 10 damage
    Then no skill messages are returned

  Scenario: Ferocity can always be upgraded
    Given a skill system with Ferocity active
    Then Ferocity can be upgraded

  Scenario: Upgrading Ferocity increases its bonus by 1
    Given a skill system with Ferocity active
    When Ferocity is upgraded
    Then Ferocity has a bonus of 2

  Scenario: Ferocity cannot be downgraded at its base value
    Given a skill system with Ferocity active
    Then Ferocity cannot be downgraded

  Scenario: Ferocity applies increased bonus after upgrade
    Given a skill system with Ferocity active
    When Ferocity is upgraded
    And the skill system processes a hit of 10 damage
    Then the resulting skill damage is 12

  # ── Dodge skill ──────────────────────────────────────────────────────────────

  Scenario: Dodge reduces incoming damage to zero when triggered
    Given a skill system with Dodge active and dodge always triggers
    When on-defend skills are applied to 10 damage
    Then the defend result damage is 0

  Scenario: Dodge produces a message when triggered
    Given a skill system with Dodge active and dodge always triggers
    When on-defend skills are applied to 10 damage
    Then the defend result includes message "Dodged!"

  Scenario: Dodge passes through damage when not triggered
    Given a skill system with Dodge active and dodge never triggers
    When on-defend skills are applied to 10 damage
    Then the defend result damage is 10

  Scenario: Dodge can be upgraded when below 50%
    Given a skill system with Dodge active
    Then Dodge can be upgraded

  Scenario: Dodge cannot be upgraded at the 50% cap
    Given a skill system with Dodge at the cap
    Then Dodge cannot be upgraded

  Scenario: Dodge cannot be downgraded at its base 1% value
    Given a skill system with Dodge active
    Then Dodge cannot be downgraded

  Scenario: Upgrading Dodge increases its dodge chance by 1%
    Given a skill system with Dodge active
    When Dodge is upgraded
    Then Dodge has a dodge chance of 2%

  Scenario: Dodge triggers during combat negating all damage
    Given a skill system with Dodge active and dodge always triggers
    When the player is attacked for 10 base damage with the dodge skill system
    Then the combat damage is 0
    And the combat result includes message "Dodged!"

  Scenario: Lucky Strike cannot be downgraded when at the minimum crit chance
    Given a new skill system
    Then Lucky Strike cannot be downgraded

  Scenario: Lucky Strike can be downgraded after being upgraded
    Given a new skill system
    When Lucky Strike is upgraded
    Then Lucky Strike can be downgraded

  Scenario: Downgrading Lucky Strike decrements its crit chance by 1%
    Given a new skill system
    When Lucky Strike is upgraded
    And Lucky Strike is downgraded
    Then the Lucky Strike skill has a 1% trigger chance

  Scenario: downgradeSkill returns true when the skill is downgraded successfully
    Given a new skill system
    When Lucky Strike is upgraded
    And Lucky Strike is downgraded
    Then the downgrade result is true

  Scenario: downgradeSkill returns false when Lucky Strike is at the minimum
    Given a new skill system
    When Lucky Strike is downgraded
    Then the downgrade result is false

  Scenario: Downgrading Lucky Strike updates its description to reflect the new chance
    Given a new skill system
    When Lucky Strike is upgraded
    And Lucky Strike is downgraded
    Then the Lucky Strike skill description contains "1%"

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
