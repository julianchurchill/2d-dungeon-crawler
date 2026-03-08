/**
 * @module tag-release
 * @description Creates and pushes an annotated git tag for the current release
 * version.  Run this after the release PR has been merged into main:
 *
 *   git checkout main && git pull
 *   npm run tag-release
 *
 * The tag name is derived from the `version` field in package.json, prefixed
 * with "v" (e.g. "v1.2.3").  The script exits with a non-zero code and an
 * explanatory message if the tag already exists.
 */

import { execSync }   from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** @returns {string} The version string from package.json, e.g. "1.2.3" */
function readVersion() {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  return pkg.version;
}

/**
 * Runs a shell command synchronously, streaming output to the terminal.
 * Throws if the command exits with a non-zero code.
 *
 * @param {string} cmd
 */
function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: root });
}

const version = readVersion();
const tag     = `v${version}`;

// Check the tag does not already exist locally or on the remote.
try {
  const existing = execSync('git tag --list', { cwd: root }).toString().trim().split('\n');
  if (existing.includes(tag)) {
    console.error(`Error: tag ${tag} already exists locally. Has this version already been released?`);
    process.exit(1);
  }
} catch {
  // git tag --list failure is non-fatal; proceed and let the tag command fail naturally.
}

console.log(`Creating annotated tag ${tag}…`);
run(`git tag -a ${tag} -m "Release ${tag}"`);

console.log(`Pushing tag ${tag} to origin…`);
run(`git push origin ${tag}`);

console.log(`Done — ${tag} is now on origin.`);
