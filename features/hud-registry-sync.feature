Feature: HUD initialised from registry on scene start

  When GameScene starts before UIScene the initial registry values (including
  dev-option overrides for floor and player level) are written before UIScene
  has registered its changedata-* event listeners.  syncHudFromRegistry must
  eagerly read those values and push them to the HUD so the display is correct
  from the first frame.

  Scenario: HUD shows floor number already in registry
    Given a registry with floor 5 already set
    When syncHudFromRegistry is called
    Then the HUD floor should display floor 5

  Scenario: HUD shows player HP already in registry
    Given a registry with HP 15 out of 30 already set
    When syncHudFromRegistry is called
    Then the HUD HP should display 15 out of 30

  Scenario: HUD shows player stats already in registry
    Given a registry with player stats level 3 attack 7 defense 2 already set
    When syncHudFromRegistry is called
    Then the HUD stats should show level 3

  Scenario: HUD is not updated when registry has no floor value
    Given an empty registry
    When syncHudFromRegistry is called
    Then the HUD floor update should not have been called
