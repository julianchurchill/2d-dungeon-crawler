Feature: Dev environment detection
  As a developer I want the dev options menu item to be hidden in production
  so that players cannot accidentally access developer tools.

  Scenario: Dev environment is detected when DEV flag is true
    Given the environment has DEV set to true
    Then the dev environment check should return true

  Scenario: Production environment is detected when DEV flag is false
    Given the environment has DEV set to false
    Then the dev environment check should return false
