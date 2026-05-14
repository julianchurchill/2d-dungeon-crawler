Feature: Save data security hardening

  Serialised save data is validated and sanitised before being applied to
  game state so that a crafted save cannot inject unexpected fields into
  player stats, pollute JavaScript prototypes, or cause out-of-bounds
  tile access.

  # ── Player stats restoration ─────────────────────────────────────────────

  Scenario: Restoring player stats ignores unknown keys
    Given saved player stats with an extra key "evil" set to 999
    When the saved stats are applied to a fresh player
    Then the player stats should not contain key "evil"

  Scenario: Restoring player stats does not pollute Object prototype
    Given saved player stats with a "__proto__" key containing a poisoned field
    When the saved stats are applied to a fresh player
    Then Object.prototype should not have been polluted by the stats restore

  # ── importSave validation ────────────────────────────────────────────────

  Scenario: importSave rejects a save with a negative floor number
    Given an empty save storage
    Then importing a crafted save with floor -1 into slot 0 should return false

  Scenario: importSave rejects a save where playerX exceeds map width
    Given an empty save storage
    Then importing a crafted save where playerX 99 exceeds map width 10 into slot 0 should return false

  Scenario: importSave rejects a save where tiles array length mismatches map dimensions
    Given an empty save storage
    Then importing a crafted save where tiles length 50 mismatches 10x10 map into slot 0 should return false

  Scenario: importSave accepts a well-formed save
    Given an empty save storage
    Then importing a well-formed crafted save into slot 0 should return true
