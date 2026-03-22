Feature: Goblin Hunting Skill

  Goblin Hunting is a permanent skill unlocked by completing the Goblin Killer
  achievement. It grants +10% bonus damage against goblins and cannot be
  upgraded or downgraded.

  Scenario: Goblin Hunting gives 10% bonus damage against goblins
    Given a Goblin Hunting skill
    When it is applied to an attack of 10 damage against a goblin
    Then the resulting damage is 11

  Scenario: Goblin Hunting deals no bonus damage against non-goblin enemies
    Given a Goblin Hunting skill
    When it is applied to an attack of 10 damage against an orc
    Then the resulting damage is 10

  Scenario: Goblin Hunting deals no bonus damage when defender type is unknown
    Given a Goblin Hunting skill
    When it is applied to an attack of 10 damage against an unknown defender
    Then the resulting damage is 10

  Scenario: Goblin Hunting cannot be upgraded
    Given a Goblin Hunting skill
    Then the Goblin Hunting skill cannot be upgraded

  Scenario: Goblin Hunting cannot be downgraded
    Given a Goblin Hunting skill
    Then the Goblin Hunting skill cannot be downgraded

  Scenario: Goblin Hunting description mentions goblins and the bonus percentage
    Given a Goblin Hunting skill
    Then the Goblin Hunting description mentions "goblin"
    And the Goblin Hunting description mentions "10%"

  # ── SkillSystem integration ───────────────────────────────────────────────

  Scenario: unlockPermanentSkill adds the skill to active skills immediately
    Given a skill system with no skills
    When a Goblin Hunting skill is unlocked as a permanent skill
    Then the unlocked skill system has 1 active skill
    And the Goblin Hunting skill is in the active skills

  Scenario: Goblin Hunting applies bonus when skill system processes a goblin hit
    Given a skill system with Goblin Hunting active
    When the skill system processes a hit of 10 damage against a goblin
    Then the goblin hunting skill system damage is 11

  Scenario: Goblin Hunting applies no bonus when skill system processes a non-goblin hit
    Given a skill system with Goblin Hunting active
    When the skill system processes a hit of 10 damage against an orc
    Then the goblin hunting skill system damage is 10
