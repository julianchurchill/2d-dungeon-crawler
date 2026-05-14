Feature: Save data security hardening

  Serialised save data is sanitised before being applied to game state
  so that a crafted save string cannot inject unexpected fields into
  player stats or pollute JavaScript prototypes.

  # ── Player stats restoration ─────────────────────────────────────────────

  Scenario: Restoring player stats ignores unknown keys
    Given saved player stats with an extra key "evil" set to 999
    When the saved stats are applied to a fresh player
    Then the player stats should not contain key "evil"

  Scenario: Restoring player stats does not pollute Object prototype
    Given saved player stats with a "__proto__" key containing a poisoned field
    When the saved stats are applied to a fresh player
    Then Object.prototype should not have been polluted by the stats restore
