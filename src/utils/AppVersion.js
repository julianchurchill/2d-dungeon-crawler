/**
 * Application version information.
 *
 * The three constants are read from src/build-info.js, which is generated at
 * dev-server start / build / test time by scripts/gen-build-info.js (run via
 * the predev / prebuild / pretest npm lifecycle hooks).  The generated file is
 * gitignored; only this module and the generation script are tracked.
 */
import { APP_VERSION, GIT_COMMIT, BUILD_DATE } from '../build-info.js';

/**
 * Formats version components into a single display string.
 *
 * @param {string} version   - Semantic version string, e.g. "0.2.0".
 * @param {string} commit    - Short git commit hash, e.g. "abc1234".
 * @param {string} buildDate - Build date/time string, e.g. "2026-03-04 10:30 UTC".
 * @returns {string} e.g. "v0.2.0 (abc1234) 2026-03-04 10:30 UTC"
 */
export function formatVersionString(version, commit, buildDate) {
  return `v${version} (${commit}) ${buildDate}`;
}

/**
 * The fully formatted version string for the current build, ready to display.
 * Example: "v0.2.0 (a3f9c12) 2026-03-04 10:30 UTC"
 */
export const APP_VERSION_STRING = formatVersionString(APP_VERSION, GIT_COMMIT, BUILD_DATE);
