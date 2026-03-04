/**
 * @module prepare-release
 * @description Prepares CHANGELOG.md for a release by renaming the [Unreleased]
 * section to the current version number (read from package.json) and inserting
 * a fresh empty [Unreleased] section above it.
 *
 * Run this before merging main into the release branch:
 *   node scripts/prepare-release.js
 *   npm run prepare-release
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** @returns {string} The version string from package.json, e.g. "0.4.0" */
function readVersion() {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  return pkg.version;
}

/** @returns {string} Today's date in YYYY-MM-DD format */
function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Updates CHANGELOG.md in place, replacing the first [Unreleased] heading with
 * a versioned heading and inserting a fresh empty [Unreleased] section above it.
 *
 * @param {string} version - Semver string, e.g. "0.4.0"
 * @param {string} date    - Release date in YYYY-MM-DD format
 */
function updateChangelog(version, date) {
  const changelogPath = join(root, 'CHANGELOG.md');
  const changelog = readFileSync(changelogPath, 'utf8');

  if (!changelog.includes('## [Unreleased]')) {
    console.error('Error: no [Unreleased] section found in CHANGELOG.md');
    process.exit(1);
  }

  if (changelog.includes(`## [${version}]`)) {
    console.error(`Error: version ${version} is already present in CHANGELOG.md`);
    process.exit(1);
  }

  // Replace the [Unreleased] heading with a fresh [Unreleased] section followed
  // by the new versioned heading, preserving any content that was under [Unreleased].
  const updated = changelog.replace(
    /## \[Unreleased\]\n([\s\S]*?)---/,
    `## [Unreleased]\n\n---\n\n## [${version}] - ${date}\n$1---`,
  );

  writeFileSync(changelogPath, updated);
  console.log(`CHANGELOG.md updated: [Unreleased] → [${version}] - ${date}`);
}

const version = readVersion();
const date = today();
updateChangelog(version, date);
