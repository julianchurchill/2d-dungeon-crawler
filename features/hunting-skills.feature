Feature: Hunting Skills

  HuntingSkill is a generic permanent skill unlocked by kill achievements.
  It grants +10% bonus damage against a specific enemy type and cannot be
  upgraded or downgraded.

  Scenario Outline: Hunting skill grants 10% bonus damage against its target type
    Given a HuntingSkill for "<skillKey>"
    When a hunting skill attack of <damage> is applied against a "<target>"
    Then the hunting skill damage result is <expected>

    Examples:
      | skillKey           | damage | target    | expected |
      | GOBLIN_HUNTING     | 10     | goblin    | 11       |
      | ORC_HUNTING        | 10     | orc       | 11       |
      | TROLL_HUNTING      | 10     | troll     | 11       |
      | COCKROACH_HUNTING  | 10     | cockroach | 11       |
      | SPRITE_HUNTING     | 10     | sprite    | 11       |

  Scenario Outline: Hunting skill deals no bonus damage against a different enemy type
    Given a HuntingSkill for "<skillKey>"
    When a hunting skill attack of 10 is applied against a "goblin"
    Then the hunting skill damage result is 10

    Examples:
      | skillKey           |
      | ORC_HUNTING        |
      | TROLL_HUNTING      |
      | COCKROACH_HUNTING  |
      | SPRITE_HUNTING     |

  Scenario Outline: Hunting skill deals no bonus damage when defender type is unknown
    Given a HuntingSkill for "<skillKey>"
    When a hunting skill attack of 10 is applied against a null defender
    Then the hunting skill damage result is 10

    Examples:
      | skillKey           |
      | GOBLIN_HUNTING     |
      | ORC_HUNTING        |
      | TROLL_HUNTING      |
      | COCKROACH_HUNTING  |
      | SPRITE_HUNTING     |

  Scenario Outline: Hunting skill cannot be upgraded or downgraded
    Given a HuntingSkill for "<skillKey>"
    Then the hunting skill cannot be upgraded
    And the hunting skill cannot be downgraded

    Examples:
      | skillKey           |
      | GOBLIN_HUNTING     |
      | ORC_HUNTING        |
      | TROLL_HUNTING      |
      | COCKROACH_HUNTING  |
      | SPRITE_HUNTING     |

  Scenario Outline: Hunting skill description mentions its target type and bonus
    Given a HuntingSkill for "<skillKey>"
    Then the hunting skill description mentions "<target>"
    And the hunting skill description mentions "10%"

    Examples:
      | skillKey           | target    |
      | GOBLIN_HUNTING     | goblin    |
      | ORC_HUNTING        | orc       |
      | TROLL_HUNTING      | troll     |
      | COCKROACH_HUNTING  | cockroach |
      | SPRITE_HUNTING     | sprite    |

  # ── SkillSystem integration ───────────────────────────────────────────────

  Scenario: unlockPermanentSkill adds a hunting skill to active skills immediately
    Given a skill system with no skills
    When a HuntingSkill for "GOBLIN_HUNTING" is unlocked as a permanent skill
    Then the unlocked skill system has 1 active skill
    And "Goblin Hunting" is in the active skills

  Scenario: Hunting skill applies bonus when skill system processes a matching hit
    Given a skill system with "GOBLIN_HUNTING" active
    When the skill system processes a hit of 10 damage against a "goblin"
    Then the skill system damage result is 11

  Scenario: Hunting skill applies no bonus when skill system processes a non-matching hit
    Given a skill system with "GOBLIN_HUNTING" active
    When the skill system processes a hit of 10 damage against a "orc"
    Then the skill system damage result is 10
