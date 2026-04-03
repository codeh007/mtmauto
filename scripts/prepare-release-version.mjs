import { execSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, '../package.json');

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Unsupported semver version: ${version}`);
  }

  return match.slice(1).map((part) => Number(part));
}

function compareVersions(left, right) {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] > rightParts[index]) {
      return 1;
    }

    if (leftParts[index] < rightParts[index]) {
      return -1;
    }
  }

  return 0;
}

function bumpPatch(version) {
  const [major, minor, patch] = parseVersion(version);
  return `${major}.${minor}.${patch + 1}`;
}

function readCurrentVersion() {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function readLatestTaggedVersion() {
  try {
    const tag = execSync('git describe --tags --abbrev=0 --match "v*"', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();

    return tag.startsWith('v') ? tag.slice(1) : tag;
  } catch {
    return null;
  }
}

const currentVersion = readCurrentVersion();
const latestTaggedVersion = readLatestTaggedVersion();

let nextVersion = currentVersion;

if (latestTaggedVersion) {
  const comparison = compareVersions(currentVersion, latestTaggedVersion);

  if (comparison === 0) {
    nextVersion = bumpPatch(currentVersion);
  } else if (comparison < 0) {
    nextVersion = bumpPatch(latestTaggedVersion);
  }
}

console.log(`Resolved release version: ${nextVersion}`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `next_version=${nextVersion}\n`);
}
