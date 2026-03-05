/**
 * @module TouchDeviceDetector
 * @description Detects whether the current device supports touch input by
 * checking the number of hardware touch points the device reports.
 */

/**
 * Returns true if the device has at least one hardware touch point.
 *
 * @param {Navigator} [nav=globalThis.navigator] - The Navigator object.
 *   Injectable for testing so that touch point counts can be controlled
 *   without a real browser environment.
 * @returns {boolean} True if the device supports touch input.
 */
export function isTouchDevice(nav = globalThis.navigator) {
  return (nav?.maxTouchPoints ?? 0) > 0;
}
