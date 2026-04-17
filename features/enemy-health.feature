Feature: Enemy health bars

  Each enemy displays a thin health bar above its sprite when visible in the
  dungeon.  The bar reflects current HP as a fraction of max HP, and is
  colour-coded green (healthy), yellow (hurt), or red (critical).

  # ── Health bar fraction ───────────────────────────────────────────────────────

  Scenario: Health bar fraction is 1.0 at full health
    Given a health bar test enemy of type "goblin"
    Then the health bar fraction is 1.0

  Scenario: Health bar fraction reflects current HP ratio
    Given a health bar test enemy of type "goblin"
    When the health bar test enemy has 4 of 8 HP
    Then the health bar fraction is 0.5

  Scenario: Health bar fraction is 0.0 when enemy is dead
    Given a health bar test enemy of type "goblin"
    When the health bar test enemy has 0 of 8 HP
    Then the health bar fraction is 0.0

  # ── Health bar colour ─────────────────────────────────────────────────────────

  Scenario: Health bar colour is green when above half health
    Then the health bar colour is 4500036 for fraction 0.6

  Scenario: Health bar colour is yellow at exactly half health
    Then the health bar colour is 11184708 for fraction 0.5

  Scenario: Health bar colour is yellow between quarter and half health
    Then the health bar colour is 11184708 for fraction 0.4

  Scenario: Health bar colour is red at exactly quarter health
    Then the health bar colour is 11158596 for fraction 0.25

  Scenario: Health bar colour is red below quarter health
    Then the health bar colour is 11158596 for fraction 0.1
