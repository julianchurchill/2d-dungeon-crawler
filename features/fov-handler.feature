Feature: FovHandler

  FovHandler encapsulates all field-of-view computation and shadow-rendering
  logic extracted from GameScene: computing the visible tile set, updating
  entity and item sprite visibility, and repainting the shadow overlay.
  It accepts a scene reference and exposes each operation as a named method.

  Scenario: FovHandler exposes the expected methods
    Given a FovHandler bound to a minimal scene context
    Then the fov handler exposes updateFOV
    And the fov handler exposes redrawShadows
