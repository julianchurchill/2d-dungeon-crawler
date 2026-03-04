Feature: Application Version Display

  Scenario: Version string includes the semantic version, commit hash, and build date
    Given a version "0.1.0", commit hash "abc1234", and build date "2026-03-04 10:30 UTC"
    When the version string is formatted
    Then the version string is "v0.1.0 (abc1234) 2026-03-04 10:30 UTC"

  Scenario: Version string uses whatever values are provided
    Given a version "1.2.3", commit hash "deadbee", and build date "2025-01-01 00:00 UTC"
    When the version string is formatted
    Then the version string is "v1.2.3 (deadbee) 2025-01-01 00:00 UTC"
