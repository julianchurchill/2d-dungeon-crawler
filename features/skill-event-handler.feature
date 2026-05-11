Feature: SkillEventHandler

  SkillEventHandler encapsulates the skill and achievement-skill event
  handlers extracted from GameScene: upgrading, downgrading, and activating
  skills via the SkillsPanel, and granting or removing skills when
  achievements are unlocked or re-locked. It accepts a scene reference
  and exposes each operation as a named method.

  Scenario: SkillEventHandler exposes the expected skill methods
    Given a SkillEventHandler bound to a minimal scene context
    Then the skill event handler exposes handleUpgradeSkill
    And the skill event handler exposes handleDowngradeSkill
    And the skill event handler exposes handleActivateSkill
    And the skill event handler exposes handleAchievementSkillUnlock
    And the skill event handler exposes handleAchievementSkillLock
