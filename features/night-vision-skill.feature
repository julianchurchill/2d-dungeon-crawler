Feature: Night Vision skill
  As a player who has reached dungeon floor 10
  I want the Night Vision skill to become available
  so that I can expand my field of view as I progress.

  # ── NightVisionSkill unit behaviour ────────────────────────────────────────

  Scenario: Night Vision skill starts with a FOV bonus of 1
    Given a Night Vision skill
    Then the night vision FOV bonus should be 1

  Scenario: Night Vision skill can always be upgraded
    Given a Night Vision skill
    Then the night vision skill can be upgraded

  Scenario: Upgrading Night Vision increases the FOV bonus by 1
    Given a Night Vision skill
    When the night vision skill is upgraded
    Then the night vision FOV bonus should be 2

  Scenario: Night Vision skill cannot be downgraded
    Given a Night Vision skill
    Then the night vision skill cannot be downgraded

  # ── SkillSystem FOV bonus ───────────────────────────────────────────────────

  Scenario: SkillSystem returns 0 FOV bonus when no Night Vision skill is active
    Given a skill system with no skills
    Then the skill system FOV bonus should be 0

  Scenario: SkillSystem returns FOV bonus of 1 when Night Vision is active at level 1
    Given a skill system with Night Vision active
    Then the skill system FOV bonus should be 1

  Scenario: SkillSystem returns FOV bonus of 2 after upgrading Night Vision
    Given a skill system with Night Vision active
    When the skill system upgrades the night vision skill
    Then the skill system FOV bonus should be 2

  # ── SkillSystem pool unlock ─────────────────────────────────────────────────

  Scenario: unlockSkill adds the skill to the inactive pool
    Given a skill system with no skills
    When a Night Vision skill is unlocked into the pool
    Then the skill system inactive pool should contain 1 skill

  Scenario: An unlocked Night Vision skill appears in getInactiveSkills
    Given a skill system with no skills
    When a Night Vision skill is unlocked into the pool
    Then the inactive skills should include "night_vision"
