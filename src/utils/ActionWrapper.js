/**
 * @module ActionWrapper
 * @description Utility functions for wrapping action callbacks with
 * pre-conditions such as cancelling an active run.
 */

/**
 * Wraps an action callback so that any active run is cancelled before the
 * action executes.  Use this for every input handler (keyboard or mobile)
 * that should interrupt a run, mirroring the single-responsibility principle:
 * the caller states *what* to do, this wrapper ensures the run is stopped
 * *before* it happens.
 *
 * @param {object}   runController - RunMovementController instance with a `cancel()` method.
 * @param {function} action        - The action to execute after cancellation.
 * @returns {function} A new function that cancels the run then calls action with any arguments.
 */
export function wrapWithRunCancel(runController, action) {
  return (...args) => {
    runController.cancel();
    action(...args);
  };
}
