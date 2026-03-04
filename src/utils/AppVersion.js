/**
 * Application version information.
 *
 * The three constants below are replaced with their actual values by Vite's
 * `define` plugin at build / dev-server start time (see vite.config.js).
 * Fallbacks are provided so the module also works in the Node.js test
 * environment where the Vite transforms are not applied.
 */

/* global __APP_VERSION__, __GIT_COMMIT__, __BUILD_DATE__ */

const _version   = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0-dev';
const _commit    = typeof __GIT_COMMIT__  !== 'undefined' ? __GIT_COMMIT__  : 'unknown';
const _buildDate = typeof __BUILD_DATE__  !== 'undefined' ? __BUILD_DATE__  : 'unknown';

/**
 * Formats version components into a single display string.
 *
 * @param {string} version   - Semantic version string, e.g. "0.1.0".
 * @param {string} commit    - Short git commit hash, e.g. "abc1234".
 * @param {string} buildDate - Build date/time string, e.g. "2026-03-04 10:30 UTC".
 * @returns {string} e.g. "v0.1.0 (abc1234) 2026-03-04 10:30 UTC"
 */
export function formatVersionString(version, commit, buildDate) {
  return `v${version} (${commit}) ${buildDate}`;
}

/**
 * The fully formatted version string for the current build, ready to display.
 * Example: "v0.1.0 (a3f9c12) 2026-03-04 10:30 UTC"
 */
export const APP_VERSION_STRING = formatVersionString(_version, _commit, _buildDate);
