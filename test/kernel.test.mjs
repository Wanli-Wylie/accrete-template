// scripts/fetch-kernel.mjs against local archives, in a copy so dist/ here is left alone.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { tempDir } from './support.mjs';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const VERSION = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).accrete.cli;
const TARGETS = {
  'linux-x64': 'x86_64-unknown-linux-musl',
  'linux-arm64': 'aarch64-unknown-linux-musl',
  'darwin-x64': 'x86_64-apple-darwin',
  'darwin-arm64': 'aarch64-apple-darwin'
};

function workspace(t) {
  const directory = tempDir(t);
  const kit = path.join(directory, 'kit');
  fs.mkdirSync(path.join(kit, 'scripts'), { recursive: true });
  fs.cpSync(path.join(REPO, 'lib'), path.join(kit, 'lib'), { recursive: true });
  fs.copyFileSync(path.join(REPO, 'package.json'), path.join(kit, 'package.json'));
  fs.copyFileSync(path.join(REPO, 'scripts/fetch-kernel.mjs'), path.join(kit, 'scripts/fetch-kernel.mjs'));
  const releases = path.join(directory, 'releases');
  fs.mkdirSync(releases);
  const fetch = (...args) => spawnSync(process.execPath, [path.join(kit, 'scripts/fetch-kernel.mjs'), ...args], { encoding: 'utf8' });
  return { directory, kit, releases, fetch, kernel: path.join(kit, 'dist/kernel') };
}

/** Archives as accrete-cli's release has them, with one combined SHA256SUMS. */
function writeRelease({ releases, directory }, platforms, { omit = [], extra = () => {} } = {}) {
  const sums = [];
  for (const platform of platforms) {
    const name = `accrete-${VERSION}-${TARGETS[platform]}`;
    const top = path.join(directory, 'build', name);
    fs.mkdirSync(path.join(top, 'licenses/rust'), { recursive: true });
    const files = { accrete: `binary for ${platform}\n`, LICENSE: 'MIT\n', 'THIRD-PARTY-NOTICES': `notices for ${platform}\n`, 'release.json': '{}\n', 'licenses/rust/MIT.txt': 'text\n' };
    for (const [file, body] of Object.entries(files)) {
      if (!omit.includes(file)) fs.writeFileSync(path.join(top, file), body);
    }
    extra(top);
    assert.equal(spawnSync('tar', ['-czf', path.join(releases, `${name}.tar.gz`), '-C', path.dirname(top), name]).status, 0);
    const digest = createHash('sha256').update(fs.readFileSync(path.join(releases, `${name}.tar.gz`))).digest('hex');
    sums.push(`${digest}  ${name}.tar.gz`);
  }
  fs.writeFileSync(path.join(releases, 'SHA256SUMS'), `${sums.join('\n')}\n`);
}

test('all four platforms land in dist/kernel with their notices, and --check passes', t => {
  const w = workspace(t);
  writeRelease(w, Object.keys(TARGETS));
  assert.notEqual(w.fetch('--check').status, 0);
  const fetched = w.fetch('--from', w.releases);
  assert.equal(fetched.status, 0, fetched.stderr);
  for (const platform of Object.keys(TARGETS)) {
    const directory = path.join(w.kernel, platform);
    assert.equal(fs.readFileSync(path.join(directory, 'accrete'), 'utf8'), `binary for ${platform}\n`);
    assert.equal(fs.statSync(path.join(directory, 'accrete')).mode & 0o777, 0o755);
    assert.equal(fs.readFileSync(path.join(directory, 'THIRD-PARTY-NOTICES'), 'utf8'), `notices for ${platform}\n`);
    assert.ok(fs.existsSync(path.join(directory, 'LICENSE')));
    assert.ok(fs.existsSync(path.join(directory, 'licenses/rust/MIT.txt')));
  }
  const index = JSON.parse(fs.readFileSync(path.join(w.kernel, 'kernel.json'), 'utf8'));
  assert.equal(index.version, VERSION);
  const checked = w.fetch('--check');
  assert.equal(checked.status, 0, checked.stderr);
  fs.writeFileSync(path.join(w.kernel, 'darwin-x64/accrete'), 'tampered');
  assert.match(w.fetch('--check').stderr, /darwin-x64 does not match/);
});

test('a missing platform fails unless --allow-partial, and --check still refuses that build', t => {
  const w = workspace(t);
  writeRelease(w, ['darwin-arm64']);
  const refused = w.fetch('--from', w.releases);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /--allow-partial is for local development only/);
  assert.ok(!fs.existsSync(w.kernel));
  assert.equal(w.fetch('--from', w.releases, '--allow-partial').status, 0);
  assert.deepEqual(fs.readdirSync(w.kernel).sort(), ['darwin-arm64', 'kernel.json']);
  assert.match(w.fetch('--check').stderr, /no Kernel for/);
});

test('a checksum mismatch, an unlisted archive, or a missing SHA256SUMS stops before dist/kernel changes', t => {
  const w = workspace(t);
  writeRelease(w, Object.keys(TARGETS));
  assert.equal(w.fetch('--from', w.releases).status, 0);
  const index = fs.readFileSync(path.join(w.kernel, 'kernel.json'));
  const sums = path.join(w.releases, 'SHA256SUMS');
  const good = fs.readFileSync(sums, 'utf8');

  fs.writeFileSync(sums, good.replace(/^[0-9a-f]{64}/, '0'.repeat(64)));
  assert.match(w.fetch('--from', w.releases).stderr, /does not match SHA256SUMS/);
  fs.writeFileSync(sums, good.split('\n').slice(1).join('\n'));
  assert.match(w.fetch('--from', w.releases).stderr, /SHA256SUMS does not list/);
  fs.rmSync(sums);
  assert.match(w.fetch('--from', w.releases).stderr, /no SHA256SUMS/);
  assert.deepEqual(fs.readFileSync(path.join(w.kernel, 'kernel.json')), index);
});

test('an archive lacking its binary or notices, or holding a link, is refused', t => {
  const lacking = workspace(t);
  writeRelease(lacking, Object.keys(TARGETS), { omit: ['THIRD-PARTY-NOTICES'] });
  assert.match(lacking.fetch('--from', lacking.releases).stderr, /lacks THIRD-PARTY-NOTICES/);

  const linked = workspace(t);
  writeRelease(linked, Object.keys(TARGETS));
  assert.equal(linked.fetch('--from', linked.releases).status, 0);
  const index = fs.readFileSync(path.join(linked.kernel, 'kernel.json'));
  fs.rmSync(path.join(linked.directory, 'build'), { recursive: true });
  writeRelease(linked, Object.keys(TARGETS), { extra: top => fs.symlinkSync('/etc/hosts', path.join(top, 'licenses/rust/link')) });
  assert.match(linked.fetch('--from', linked.releases).stderr, /other than files and directories/);
  assert.deepEqual(fs.readFileSync(path.join(linked.kernel, 'kernel.json')), index);
});
