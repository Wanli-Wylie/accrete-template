// The tarball, not the source tree: npm decides what actually ships.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { snapshot, tempDir } from './support.mjs';

const REPO = fileURLToPath(new URL('..', import.meta.url));

test('the packed bin creates a complete Workspace', t => {
  const directory = tempDir(t);
  const packed = spawnSync('npm', ['pack', '--json', '--pack-destination', directory], { cwd: REPO, encoding: 'utf8' });
  assert.equal(packed.status, 0, packed.stderr);
  const [{ filename, files }] = JSON.parse(packed.stdout.slice(packed.stdout.indexOf('[')));
  const names = files.map(file => file.path);
  assert.ok(names.includes('bin/accrete-kit.mjs'));
  assert.ok(names.includes('dist/scaffold/manifest.json'));
  assert.ok(names.includes('dist/scaffold/assets/template/_gitignore'));
  assert.ok(names.includes('LICENSE'));
  assert.ok(!names.some(name => /^(?:test|scripts|skills|template|contract|schemas)\//.test(name)));
  assert.equal(spawnSync('tar', ['-xzf', path.join(directory, filename), '-C', directory]).status, 0);
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'package/package.json'), 'utf8'));
  assert.equal(manifest.dependencies, undefined);
  assert.equal(manifest.license, 'MIT');

  const created = spawnSync(process.execPath, [path.join(directory, 'package/bin/accrete-kit.mjs'), 'create', 'w', '--no-git', '--no-install', '--json'], { cwd: directory, encoding: 'utf8' });
  assert.equal(created.status, 0, created.stderr);
  const root = path.join(directory, 'w');
  const inventory = JSON.parse(fs.readFileSync(path.join(root, '.accrete/template-install.json'), 'utf8'));
  for (const { destination } of inventory.files) assert.ok(fs.existsSync(path.join(root, destination)), destination);
  assert.match(fs.readFileSync(path.join(root, '.gitignore'), 'utf8'), /^\/\.accrete\/bin\/$/m);
  assert.ok(fs.existsSync(path.join(root, '.agents/skills/accrete-data/SKILL.md')));
  assert.ok(fs.existsSync(path.join(root, '.claude/skills/accrete-data/SKILL.md')));

  // Whatever this checkout has fetched ships intact: mode, notices, and a binary that runs.
  const packedKernel = path.join(directory, 'package/dist/kernel');
  const host = `${process.platform}-${process.arch}`;
  if (fs.existsSync(path.join(packedKernel, host))) {
    for (const file of ['LICENSE', 'THIRD-PARTY-NOTICES']) assert.ok(names.includes(`dist/kernel/${host}/${file}`), file);
    const restored = spawnSync(process.execPath, [path.join(directory, 'package/bin/accrete-kit.mjs'), 'install', '--project', 'w', '--json'], { cwd: directory, encoding: 'utf8' });
    assert.equal(restored.status, 0, restored.stderr);
    const version = JSON.parse(fs.readFileSync(path.join(packedKernel, 'kernel.json'), 'utf8')).version;
    assert.equal(spawnSync(path.join(root, '.accrete/bin/accrete'), ['--version'], { encoding: 'utf8' }).stdout.trim(), `accrete ${version}`);
  }

  // The same for the UI: every fetched file, and a spawn-helper that is still executable.
  // Without a fetched UI there is nothing to ship, and test/ui.test.mjs packs a stand-in.
  const fetchedUi = path.join(REPO, 'dist/ui');
  if (fs.existsSync(fetchedUi)) {
    for (const file of Object.keys(snapshot(fetchedUi))) assert.ok(names.includes(`dist/ui/${file}`), file);
    for (const platform of ['darwin-arm64', 'darwin-x64']) {
      const helper = path.join(directory, 'package/dist/ui/vendor/node-pty/prebuilds', platform, 'spawn-helper');
      assert.equal(fs.statSync(helper).mode & 0o777, 0o755, platform);
    }
  }

  // The documented spelling, with the package resolved from a local install: npx hands
  // the subcommand and its flags straight to the bin.
  const npm = args => spawnSync('npm', ['--offline', ...args], { cwd: directory, encoding: 'utf8' });
  const installed = npm(['install', '--no-audit', '--no-fund', path.join(directory, filename)]);
  assert.equal(installed.status, 0, installed.stderr);
  const upgraded = spawnSync('npx', ['--offline', '--no', 'accrete-kit', 'upgrade', '--dry-run', '--project', 'w', '--no-install', '--json'], { cwd: directory, encoding: 'utf8' });
  assert.equal(upgraded.status, 0, upgraded.stderr);
  const receipt = JSON.parse(upgraded.stdout.slice(upgraded.stdout.indexOf('{"')));
  assert.equal(receipt.action, 'upgrade');
  assert.equal(receipt.dry_run, true);
  assert.equal(receipt.project_root, root);
});
