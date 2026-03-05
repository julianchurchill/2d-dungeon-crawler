/**
 * @module TouchDeviceDetector
 * @description Detects whether the current device has a touchscreen by
 * combining two signals: hardware touch point count and pointer precision.
 *
 * Using maxTouchPoints alone is insufficient on Windows — precision touchpads
 * report touch points even on laptops without a touchscreen. The additional
 * `pointer: coarse` media query confirms the primary pointer is a finger
 * rather than a mouse or touchpad.
 */

/**
 * Returns true only if the device both reports touch points AND has a coarse
 * (finger-level) primary pointer, indicating a real touchscreen.
 *
 * @param {Navigator} [nav=globalThis.navigator] - The Navigator object.
 *   Injectable for testing.
 * @param {function(string): {matches: boolean}} [matchMedia] - A matchMedia
 *   function. Injectable for testing.
 * @returns {boolean} True if the device has a touchscreen.
 */
export function isTouchDevice(
  nav = globalThis.navigator,
  matchMedia = (q) => globalThis.window?.matchMedia(q),
) {
  return (nav?.maxTouchPoints ?? 0) > 0 && matchMedia('(pointer: coarse)')?.matches === true;
}
