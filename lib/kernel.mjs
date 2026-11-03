// The Kernel binaries this package carries, and the copy each Workspace runs.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { AccreteError, readCurrent, sha256 } from './fsutil.mjs';

export const BINARY = '.accrete/bin/accrete';

// Node's platform and architecture, as the Rust target accrete-cli releases for them.
export const PLATFORMS = {
  'linux-x64': 'x86_64-unknown-linux-musl',
  'linux-arm64': 'aarch64-unknown-linux-musl',
  'darwin-x64': 'x86_64-apple-darwin',
  'darwin-arm64': 'aarch64-apple-darwin'
};

export const hostPlatform = () => `${process.platform}-${process.arch}`;

export function numericVersion(text) {
  const match = /^(\d+)\.(\d+)\.(\d+)(-[^+]+)?(?:\+.*)?$/.exec(text);
  return match && { numbers: match.slice(1, 4).map(Number), prerelease: match[4] ?? null };
}

export function compareVersions(a, b) {
  for (const index of [0, 1, 2]) {
    if (a.numbers[index] !== b.numbers[index]) return a.numbers[index] - b.numbers[index];
  }
  if (a.prerelease === b.prerelease) return 0;
  if (a.prerelease === null) return 1;
  if (b.prerelease === null) return -1;
  return a.prerelease < b.prerelease ? -1 : 1;
}

/** This host's binary from the package, checked against what fetch-kernel recorded. */
function embeddedBinary(scaffold) {
  const host = hostPlatform();
  let index = null;
  try {
    index = JSON.parse(fs.readFileSync(path.join(scaffold.kernelDirectory, 'kernel.json'), 'utf8'));
  } catch {
    // No binaries at all reads the same as none for this host.
  }
  const entry = index?.platforms?.[host];
  if (!Object.hasOwn(PLATFORMS, host) || !entry) {
    throw new AccreteError('dependency', `accrete-kit ${scaffold.template_version} has no Kernel for ${host}; `
      + `it supports ${Object.keys(PLATFORMS).join(', ')}. Elsewhere, extract the accrete ${scaffold.kernel_version} `
      + 'release archive into <workspace>/.accrete/bin/');
  }
  if (index.version !== scaffold.kernel_version) {
    throw new AccreteError('invalid', `This package carries Kernel ${index.version} but declares ${scaffold.kernel_version}; run scripts/fetch-kernel.mjs`);
  }
  const bytes = fs.readFileSync(path.join(scaffold.kernelDirectory, host, 'accrete'));
  if (sha256(bytes) !== entry.sha256) throw new AccreteError('invalid', `The embedded Kernel for ${host} does not match its recorded digest`);
  return bytes;
}

function runsAs(target, version) {
  const result = spawnSync(target, ['--version'], { encoding: 'utf8', timeout: 10000 });
  return result.status === 0 && result.stdout.trim() === `accrete ${version}`;
}

/**
 * Put this host's Kernel at .accrete/bin/accrete. A binary already there that runs as the
 * declared version stays, whatever its bytes. `write` publishes and records the path.
 */
export function installKernel(root, scaffold, { dryRun = false, write }) {
  const version = scaffold.kernel_version;
  const report = action => ({ version, platform: hostPlatform(), path: BINARY, action });
  const current = readCurrent(root, BINARY);
  if (current.kind === 'other') throw new AccreteError('conflict', `${BINARY} is not a regular file, or a symbolic link is above it`);
  if (current.kind === 'file' && runsAs(path.join(root, BINARY), version)) return report('unchanged');
  const bytes = embeddedBinary(scaffold);
  if (dryRun) return report('would-install');
  write(BINARY, bytes, { mode: 0o755 });
  return report('installed');
}
