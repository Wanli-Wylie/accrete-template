// scripts/fetch-ui.mjs and the ui subcommand against stand-ins, in copies so dist/ here is left alone.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { kitCopy, tempDir } from './support.mjs';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const VERSION = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).accrete.ui;
const NAME = `accrete-ui-${VERSION}`;
const HELPERS = ['darwin-arm64', 'darwin-x64'].map(platform => `vendor/node-pty/prebuilds/${platform}/spawn-helper`);

// The real one's shape: a nested package.json with its own `files`, and a spawn-helper at 0644.
const FILES = {
  'bin/accrete-ui.mjs': 'bin\n',
  'server/server.mjs': 'server\n',
  'page/index.html': 'page\n',
  LICENSE: 'MIT\n',
  'THIRD-PARTY-NOTICES': 'notices\n',
  'vendor/node-pty/package.json': '{ "name": "node-pty", "files": ["lib/", "prebuilds/"] }\n',
  'vendor/node-pty/lib/index.js': 'lib\n',
  [HELPERS[0]]: 'helper\n',
  [HELPERS[1]]: 'helper\n'
};

function workspace(t) {
  const directory = tempDir(t);
  const kit = path.join(directory, 'kit');
  fs.mkdirSync(path.join(kit, 'scripts'), { recursive: true });
  fs.copyFileSync(path.join(REPO, 'package.json'), path.join(kit, 'package.json'));
  fs.copyFileSync(path.join(REPO, 'scripts/fetch-ui.mjs'), path.join(kit, 'scripts/fetch-ui.mjs'));
  const releases = path.join(directory, 'releases');
  fs.mkdirSync(releases);
  const fetch = (...args) => spawnSync(process.execPath, [path.join(kit, 'scripts/fetch-ui.mjs'), ...args], { encoding: 'utf8' });
  return { directory, kit, releases, fetch, ui: path.join(kit, 'dist/ui') };
}

/** The archive as accrete-ui's release has it, with its SHA256SUMS. */
function writeRelease({ releases, directory }, { omit = [], extra = () => {} } = {}) {
  const top = path.join(directory, 'build', NAME);
  fs.rmSync(top, { recursive: true, force: true });
  for (const [file, body] of Object.entries(FILES)) {
    if (omit.includes(file)) continue;
    fs.mkdirSync(path.dirname(path.join(top, file)), { recursive: true });
    fs.writeFileSync(path.join(top, file), body);
  }
  extra(top);
  const archive = path.join(releases, `${NAME}.tar.gz`);
  assert.equal(spawnSync('tar', ['-czf', archive, '-C', path.dirname(top), NAME]).status, 0);
  const digest = createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
  fs.writeFileSync(path.join(releases, 'SHA256SUMS'), `${digest}  ${NAME}.tar.gz\n`);
}

test('the archive lands in dist/ui, spawn-helper is executable after npm pack, and --check passes', t => {
  const w = workspace(t);
  writeRelease(w);
  assert.notEqual(w.fetch('--check').status, 0);
  const fetched = w.fetch('--from', w.releases);
  assert.equal(fetched.status, 0, fetched.stderr);
  for (const [file, body] of Object.entries(FILES)) assert.equal(fs.readFileSync(path.join(w.ui, file), 'utf8'), body);
  const checked = w.fetch('--check');
  assert.equal(checked.status, 0, checked.stderr);

  const packed = spawnSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', w.directory], { cwd: w.kit, encoding: 'utf8' });
  assert.equal(packed.status, 0, packed.stderr);
  const [{ filename, files }] = JSON.parse(packed.stdout.slice(packed.stdout.indexOf('[')));
  const names = files.map(file => file.path);
  for (const file of Object.keys(FILES)) assert.ok(names.includes(`dist/ui/${file}`), file);
  assert.equal(spawnSync('tar', ['-xzf', path.join(w.directory, filename), '-C', w.directory]).status, 0);
  for (const helper of HELPERS) assert.equal(fs.statSync(path.join(w.directory, 'package/dist/ui', helper)).mode & 0o777, 0o755, helper);

  fs.chmodSync(path.join(w.ui, HELPERS[0]), 0o644);
  assert.match(w.fetch('--check').stderr, /not executable/);
  fs.writeFileSync(path.join(w.ui, 'ui.json'), '{ "version": "9.9.9" }\n');
  assert.match(w.fetch('--check').stderr, /holds 9\.9\.9/);
});

test('a checksum mismatch, an unlisted archive, or a missing SHA256SUMS stops before dist/ui changes', t => {
  const w = workspace(t);
  writeRelease(w);
  assert.equal(w.fetch('--from', w.releases).status, 0);
  const index = fs.readFileSync(path.join(w.ui, 'ui.json'));
  const sums = path.join(w.releases, 'SHA256SUMS');
  const good = fs.readFileSync(sums, 'utf8');

  fs.writeFileSync(sums, good.replace(/^[0-9a-f]{64}/, '0'.repeat(64)));
  assert.match(w.fetch('--from', w.releases).stderr, /does not match SHA256SUMS/);
  fs.writeFileSync(sums, '');
  assert.match(w.fetch('--from', w.releases).stderr, /SHA256SUMS does not list/);
  fs.rmSync(sums);
  assert.match(w.fetch('--from', w.releases).stderr, /no SHA256SUMS/);
  assert.deepEqual(fs.readFileSync(path.join(w.ui, 'ui.json')), index);
});

test('an archive lacking its notices, or holding a link, is refused and leaves what was there', t => {
  const lacking = workspace(t);
  writeRelease(lacking, { omit: ['THIRD-PARTY-NOTICES'] });
  assert.match(lacking.fetch('--from', lacking.releases).stderr, /lacks THIRD-PARTY-NOTICES/);
  assert.ok(!fs.existsSync(lacking.ui));

  const linked = workspace(t);
  writeRelease(linked);
  assert.equal(linked.fetch('--from', linked.releases).status, 0);
  const index = fs.readFileSync(path.join(linked.ui, 'ui.json'));
  writeRelease(linked, { extra: top => fs.symlinkSync('/etc/hosts', path.join(top, 'page/link')) });
  assert.match(linked.fetch('--from', linked.releases).stderr, /other than files and directories/);
  assert.deepEqual(fs.readFileSync(path.join(linked.ui, 'ui.json')), index);
});

// Copied before any test runs, as cli.test.mjs does: npm pack rebuilds dist/scaffold here.
const KITS = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'accrete-kit-')));
after(() => fs.rmSync(KITS, { recursive: true, force: true }));
const BARE_BIN = kitCopy(path.join(KITS, 'without-ui'));
const UI_BIN = kitCopy(path.join(KITS, 'with-ui'));
const standIn = path.join(KITS, 'with-ui/dist/ui/bin/accrete-ui.mjs');
fs.mkdirSync(path.dirname(standIn), { recursive: true });
fs.writeFileSync(standIn, 'console.log(JSON.stringify(process.argv.slice(2)));\nprocess.exit(3);\n');

const run = (cwd, args, bin = UI_BIN) => spawnSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8' });

test('ui refuses flags that do not apply, and its own flags are refused elsewhere', t => {
  const cwd = tempDir(t);
  for (const flags of [['--json'], ['--name', 'x'], ['--dry-run'], ['--agents', 'none']]) {
    assert.match(run(cwd, ['ui', ...flags], BARE_BIN).stderr, /does not apply to ui/, flags[0]);
  }
  for (const args of [['create', 'w', '--port', '1'], ['upgrade', '--no-open'], ['install', '--no-tmux']]) {
    const refused = run(cwd, args, BARE_BIN);
    assert.equal(refused.status, 2, args.join(' '));
    assert.match(refused.stderr, /does not apply/, args.join(' '));
  }
  assert.deepEqual(fs.readdirSync(cwd), []);
});

test('ui says so where it cannot run: anywhere but macOS, or a package with no dist/ui', t => {
  const refused = run(tempDir(t), ['ui'], BARE_BIN);
  assert.equal(refused.status, 5);
  assert.match(refused.stderr, process.platform === 'darwin' ? /no UI in dist\/ui/ : /macOS only/);
  if (process.platform !== 'darwin') assert.match(run(tempDir(t), ['ui']).stderr, /macOS only/);
});

test('ui runs the bundled bin on the selected Workspace and returns its exit code', { skip: process.platform !== 'darwin' }, t => {
  const directory = tempDir(t);
  const root = path.join(directory, 'w');
  fs.mkdirSync(path.join(root, '.accrete/nested'), { recursive: true });
  fs.writeFileSync(path.join(root, '.accrete/project.toml'), 'name = "w"\n');

  const missing = run(directory, ['ui']);
  assert.equal(missing.status, 3);
  assert.match(missing.stderr, /No ACCRETE Workspace/);

  const named = run(directory, ['ui', '--project', 'w', '--no-open', '--no-tmux', '--port', '4100']);
  assert.equal(named.status, 3, named.stderr);
  assert.deepEqual(JSON.parse(named.stdout), ['--project', root, '--no-open', '--no-tmux', '--port', '4100']);
  const nearest = run(path.join(root, '.accrete/nested'), ['ui']);
  assert.deepEqual(JSON.parse(nearest.stdout), ['--project', root]);
});
