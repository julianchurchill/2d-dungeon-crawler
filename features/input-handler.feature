Feature: InputHandler

  InputHandler encapsulates all keyboard, pointer, and EventBus input routing
  extracted from GameScene: setting up key bindings, pointer events, and
  dispatching D-pad and mobile menu events to the appropriate scene actions.
  It accepts a scene reference and exposes each operation as a named method.

  Scenario: InputHandler exposes the expected methods
    Given an InputHandler bound to a minimal scene context
    Then the input handler exposes setup
    And the input handler exposes setupEvents
