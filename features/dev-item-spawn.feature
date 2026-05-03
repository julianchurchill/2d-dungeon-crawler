Feature: Developer forced floor item spawns
  As a developer I want to force rare floor item drops so that I can
  test item interactions without relying on low-probability RNG rolls.

  Background:
    Given developer options are reset to defaults

  Scenario: Default forced floor items set is empty
    Then the dev forced floor items should be empty

  Scenario: A floor item can be forced to spawn
    When the dev forced floor item "PICK_AXE" is enabled
    Then "PICK_AXE" should be a forced floor item

  Scenario: A forced floor item can be un-forced
    Given the dev forced floor item "PICK_AXE" is enabled
    When the dev forced floor item "PICK_AXE" is disabled
    Then "PICK_AXE" should not be a forced floor item

  Scenario: Reset clears all forced floor items
    Given the dev forced floor item "PICK_AXE" is enabled
    When developer options are reset
    Then the dev forced floor items should be empty

  Scenario: PICK_AXE is registered in the rare floor drop items list
    Then "PICK_AXE" should be in the rare floor drop items list

  Scenario: getPickAxeFloorDrop respects the forced flag and skips RNG
    When getPickAxeFloorDrop is called with an always-false RNG and forced true
    Then the pick axe floor drop result should be ITEM_TYPES.PICK_AXE

  Scenario: getPickAxeFloorDrop returns null when not forced and RNG fails
    When getPickAxeFloorDrop is called with an always-false RNG and forced false
    Then the pick axe floor drop result should be null

  Scenario: getPickAxeFloorDrop still fires normally when not forced and RNG succeeds
    When getPickAxeFloorDrop is called with an always-true RNG and forced false
    Then the pick axe floor drop result should be ITEM_TYPES.PICK_AXE
