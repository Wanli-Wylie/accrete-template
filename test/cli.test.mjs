// The real bin and assembled scaffold, with a stand-in Kernel for this host.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { after, test } from 'node:test';
import os from 'node:os';
import { DECLARED, HOST, kitCopy, sha, snapshot, stubKernel, tempDir } from './support.mjs';

const KITS = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'accrete-kit-')));
after(() => fs.rmSync(KITS, { recursive: true, force: true }));
const BIN = kitCopy(path.join(KITS, 'with-kernel'));
const BARE_BIN = kitCopy(path.join(KITS, 'without-kernel'), { kernel: false });
const KERNEL = '.accrete/bin/accrete';
const read = (root, relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (root, relative) => fs.existsSync(path.join(root, relative));

function run(cwd, args, bin = BIN) {
  const result = spawnSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8' });
  const parsed = args.includes('--json') && result.stdout ? JSON.parse(result.stdout) : null;
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, json: parsed };
}

test('creates only the marker and the assets with --no-install, and leaves stores to first use', t => {
  const cwd = tempDir(t);
  const created = run(cwd, ['create', 'my-project', '--no-install', '--json']);
  assert.equal(created.status, 0, created.stderr);
  const root = path.join(cwd, 'my-project');
  const receipt = created.json;
  assert.equal(receipt.ok, true);
  assert.equal(receipt.action, 'create');
  assert.equal(receipt.created, true);
  assert.equal(receipt.git_initialized, true);
  assert.deepEqual(receipt.selected_profiles, ['codex', 'claude']);
  assert.deepEqual(receipt.pending, []);
  assert.ok(receipt.written.includes('.accrete/project.toml'));
  assert.ok(receipt.written.includes('AGENTS.md'));
  assert.ok(exists(root, '.git'));
  for (const asset of ['.accrete/project.toml', 'AGENTS.md', 'CLAUDE.md', '.gitignore', '.gitattributes', '.accrete/PROJECT.md',
    '.accrete/release.json', '.accrete/docs/cli-commands.md', '.accrete/contracts/cli-v1.json',
    '.agents/skills/accrete-models/SKILL.md', '.claude/skills/accrete-models/SKILL.md']) {
    assert.ok(exists(root, asset), asset);
  }
  for (const lazy of ['.accrete/objects', 'results', 'memory', 'tools', 'scratch', '.accrete/data', '.accrete/bin', 'node_modules',
    'package.json', '.claude/settings.json', '.codex']) {
    assert.ok(!exists(root, lazy), lazy);
  }
  assert.equal(receipt.kernel.action, 'skipped');
  assert.equal(read(root, '.gitignore').split('\n').filter(line => line.startsWith('/')).join(' '),
    '/.accrete/local.toml /.accrete/data/ /.accrete/bin/ /scratch/');
  const marker = read(root, '.accrete/project.toml');
  assert.match(marker, /^format = 1\nproject_id = "[0-9a-f-]{36}"\nname = "my-project"\ntimezone = "UTC"\n/);
  const inventory = JSON.parse(read(root, '.accrete/template-install.json'));
  assert.equal(inventory.schema_version, 1);
  assert.equal(inventory.template_version, receipt.template_version);
  assert.equal(inventory.kernel_version, DECLARED);
  assert.equal(JSON.parse(read(root, '.accrete/release.json')).kernel_version, DECLARED);
  for (const { base_sha256: base } of inventory.files) {
    if (base) assert.ok(exists(root, `.accrete/template-bases/${base}`));
  }
  // Nothing proposed against an unchanged Workspace.
  const again = run(root, ['upgrade', '--dry-run', '--no-install', '--json']);
  assert.deepEqual([...new Set(again.json.files.map(file => file.action))].sort(), ['keep-seed', 'unchanged']);
});

test('--agents selects host files, none keeps the common files, and a bad value changes nothing', t => {
  const cwd = tempDir(t);
  for (const [agents, codex, claude] of [['none', false, false], ['codex', true, false], ['claude', false, true]]) {
    const created = run(cwd, ['create', agents, '--agents', agents, '--no-git', '--no-install']);
    assert.equal(created.status, 0, created.stderr);
    const root = path.join(cwd, agents);
    assert.ok(exists(root, 'AGENTS.md'));
    assert.ok(exists(root, '.accrete/docs/overview.md'));
    assert.equal(exists(root, '.agents/skills/accrete-data/SKILL.md'), codex);
    assert.equal(exists(root, '.claude/skills/accrete-data/SKILL.md'), claude);
    assert.equal(exists(root, 'CLAUDE.md'), claude);
  }
  const bad = run(cwd, ['create', 'bad', '--agents', 'codex,gemini', '--no-git']);
  assert.equal(bad.status, 2);
  assert.ok(!exists(cwd, 'bad'));
});

test('--name, --id, --timezone and --no-git are applied, and Git is on by default', t => {
  const cwd = tempDir(t);
  const created = run(cwd, ['create', 'named', '--name', 'Named "project"', '--id', 'named-project.1', '--timezone', 'Asia/Shanghai', '--agents', 'codex', '--no-git', '--no-install', '--json']);
  assert.equal(created.status, 0, created.stderr);
  assert.equal(created.json.project_id, 'named-project.1');
  assert.equal(created.json.timezone, 'Asia/Shanghai');
  assert.equal(created.json.git_initialized, false);
  const root = path.join(cwd, 'named');
  assert.ok(!exists(root, '.git'));
  assert.ok(!exists(root, '.claude'));
  assert.match(read(root, '.accrete/project.toml'), /^name = "Named \\"project\\""$/m);
  for (const args of [['--id', '../x'], ['--timezone', 'Mars/Olympus'], ['--timezone', 'asia/shanghai'], ['--name', '']]) {
    assert.equal(run(cwd, ['create', 'refused', ...args, '--no-git']).status, 2, args.join(' '));
    assert.ok(!exists(cwd, 'refused'));
  }
});

test('a repeated creation keeps the identity and the deletions; conflicting identity is an error', t => {
  const cwd = tempDir(t);
  run(cwd, ['create', 'project', '--no-git', '--no-install']);
  const root = path.join(cwd, 'project');
  const marker = read(root, '.accrete/project.toml');
  fs.rmSync(path.join(root, '.accrete/docs/overview.md'));
  const again = run(cwd, ['create', 'project', '--no-git', '--no-install', '--json']);
  assert.equal(again.status, 0, again.stderr);
  assert.equal(again.json.created, false);
  assert.equal(read(root, '.accrete/project.toml'), marker);
  assert.ok(!exists(root, '.accrete/docs/overview.md'));
  assert.equal(run(cwd, ['create', 'project', '--id', 'another-identity', '--no-git']).status, 4);
  assert.equal(run(cwd, ['create', 'project', '--name', 'another-name', '--no-git']).status, 4);
  assert.equal(read(root, '.accrete/project.toml'), marker);
});

test('a repeated creation from another version points at upgrade and changes nothing', t => {
  const cwd = tempDir(t);
  run(cwd, ['create', 'project', '--no-git', '--no-install']);
  const root = path.join(cwd, 'project');
  const inventory = JSON.parse(read(root, '.accrete/template-install.json'));
  inventory.template_version = '0.0.1';
  fs.writeFileSync(path.join(root, '.accrete/template-install.json'), JSON.stringify(inventory));
  const before = snapshot(root);
  const again = run(cwd, ['create', 'project', '--no-install', '--json']);
  assert.equal(again.status, 0);
  assert.equal(again.json.skipped, true);
  assert.match(again.json.message, /npx accrete-kit@\S+ upgrade/);
  assert.deepEqual(snapshot(root), before);
});

test('an existing repository keeps its own AGENTS.md and .gitignore', t => {
  const root = tempDir(t);
  spawnSync('git', ['init', '-q'], { cwd: root });
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Mine\n');
  fs.writeFileSync(path.join(root, '.gitignore'), 'build/\n*.log\n');
  const created = run(root, ['create', '.', '--no-install', '--json']);
  assert.equal(created.status, 0, created.stderr);
  assert.equal(created.json.git_initialized, false);
  assert.equal(created.json.name, path.basename(root));
  assert.ok(read(root, 'AGENTS.md').startsWith('# Mine\n\n<!-- accrete:begin -->\n'));
  assert.ok(!read(root, 'AGENTS.md').includes('Owner guidance'));
  const ignore = read(root, '.gitignore');
  assert.ok(ignore.startsWith('build/\n*.log\n\n# accrete:begin\n'));
  assert.equal(ignore.match(/\/\.accrete\/bin\//g).length, 1);
});

test('a first-install conflict exits 0, warns on stderr, and --accept resolves it end to end', t => {
  const cwd = tempDir(t);
  const root = path.join(cwd, 'project');
  fs.mkdirSync(path.join(root, '.accrete/docs'), { recursive: true });
  fs.writeFileSync(path.join(root, '.accrete/docs/overview.md'), 'my overview\n');
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '<!-- accrete:begin -->\nmine\n<!-- accrete:end -->\n');
  const created = run(cwd, ['create', 'project', '--no-git', '--no-install', '--json']);
  assert.equal(created.status, 0, created.stderr);
  assert.deepEqual(created.json.pending, ['.accrete/docs/overview.md', 'AGENTS.md']);
  assert.ok(created.json.files.find(file => file.destination === 'AGENTS.md').next.endsWith(`npx accrete-kit@${created.json.template_version} upgrade --accept AGENTS.md`));
  assert.match(created.stderr, /warning: 2 path\(s\) were preserved/);
  assert.equal(read(root, '.accrete/docs/overview.md'), 'my overview\n');
  const version = created.json.template_version;
  const incoming = read(root, `.accrete/template-upgrades/${version}/AGENTS.md.incoming`);
  assert.ok(incoming.startsWith('<!-- accrete:begin -->\n') && incoming.endsWith('<!-- accrete:end -->\n'));
  assert.ok(!incoming.includes('Owner guidance'));

  const sub = path.join(root, '.accrete/docs');
  const accepted = run(sub, ['upgrade', '--accept', 'AGENTS.md', '--no-install', '--json']);
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.deepEqual(accepted.json.pending, ['.accrete/docs/overview.md']);
  assert.equal(read(root, 'AGENTS.md'), '<!-- accrete:begin -->\nmine\n<!-- accrete:end -->\n');
  assert.ok(!exists(root, `.accrete/template-upgrades/${version}/AGENTS.md.incoming`));
  assert.equal(accepted.json.kernel, undefined);
  assert.equal(run(root, ['upgrade', '--accept', 'AGENTS.md', '--no-install']).status, 4);
});

test('a per-path I/O failure is reported per path with a nonzero exit', t => {
  const cwd = tempDir(t);
  const root = path.join(cwd, 'project');
  const locked = path.join(root, '.accrete/docs');
  fs.mkdirSync(locked, { recursive: true });
  fs.chmodSync(locked, 0o555);
  const created = run(cwd, ['create', 'project', '--no-git', '--no-install', '--json']);
  fs.chmodSync(locked, 0o755);
  assert.equal(created.status, 7);
  assert.equal(created.json.ok, false);
  assert.ok(created.json.failed.some(item => item.destination === '.accrete/docs/overview.md'));
  assert.ok(!created.json.failed.some(item => item.destination === 'AGENTS.md'));
  assert.ok(exists(root, 'AGENTS.md'));
  const retried = run(cwd, ['create', 'project', '--no-git', '--no-install', '--json']);
  assert.equal(retried.status, 0, retried.stderr);
  assert.ok(exists(root, '.accrete/docs/overview.md'));
});

test('create installs this host\'s Kernel with mode 0755, and next steps run it', t => {
  const cwd = tempDir(t);
  const created = run(cwd, ['create', 'project', '--no-git', '--json']);
  assert.equal(created.status, 0, created.stderr);
  const root = path.join(cwd, 'project');
  assert.deepEqual(created.json.kernel, { version: DECLARED, platform: HOST, path: KERNEL, action: 'installed' });
  assert.ok(created.json.written.includes(KERNEL));
  assert.equal(fs.statSync(path.join(root, KERNEL)).mode & 0o777, 0o755);
  assert.equal(spawnSync(path.join(root, KERNEL), ['--version'], { encoding: 'utf8' }).stdout.trim(), `accrete ${DECLARED}`);
  assert.deepEqual(created.json.next_steps.slice(0, 2), ['cd project', `${KERNEL} --version`]);
  assert.ok(!exists(root, 'package.json'));
  assert.ok(!exists(root, 'node_modules'));
  assert.ok(fs.readdirSync(path.join(root, '.accrete/bin')).every(name => name === 'accrete'));
});

test('--no-install skips the binary and names the install to run', t => {
  const cwd = tempDir(t);
  const skipped = run(cwd, ['create', 'project', '--no-git', '--no-install']);
  assert.equal(skipped.status, 0);
  assert.ok(!exists(path.join(cwd, 'project'), KERNEL));
  const version = JSON.parse(read(path.join(cwd, 'project'), '.accrete/release.json')).template_version;
  assert.ok(skipped.stdout.includes(`Next steps:\n  cd project\n  npx accrete-kit@${version} install\n  ${KERNEL} --version\n`));
});

test('an existing package.json is untouched', t => {
  const root = tempDir(t);
  const owner = '{\n    "name": "mine",\n    "files": ["a", "b"]\n}\n';
  fs.writeFileSync(path.join(root, 'package.json'), owner);
  const created = run(root, ['create', '.', '--no-git', '--json']);
  assert.equal(created.status, 0, created.stderr);
  assert.equal(read(root, 'package.json'), owner);
  assert.ok(!created.json.written.includes('package.json'));
});

test('a host with no embedded Kernel names the platforms, and the Workspace is still created', t => {
  const cwd = tempDir(t);
  const root = path.join(cwd, 'my project');
  const created = run(cwd, ['create', 'my project', '--no-git', '--json'], BARE_BIN);
  assert.equal(created.status, 7);
  assert.equal(created.json.ok, false);
  assert.equal(created.json.kernel.action, 'failed');
  const [failure] = created.json.failed;
  assert.equal(failure.destination, KERNEL);
  for (const platform of ['linux-x64', 'linux-arm64', 'darwin-x64', 'darwin-arm64']) assert.ok(failure.error.includes(platform));
  assert.ok(failure.retry.endsWith(`install --project '${root}'`));
  assert.ok(exists(root, 'AGENTS.md'));
  assert.ok(exists(root, '.accrete/template-install.json'));
  assert.ok(!exists(root, KERNEL));
  // Without the binary step the same package is fine, and install reports it directly.
  assert.equal(run(cwd, ['create', 'other', '--no-git', '--no-install'], BARE_BIN).status, 0);
  const restore = run(root, ['install'], BARE_BIN);
  assert.equal(restore.status, 5);
  assert.match(restore.stderr, /supports linux-x64/);
});

test('install restores the Kernel after a clone, from anywhere, and leaves a working one alone', t => {
  const cwd = tempDir(t);
  run(cwd, ['create', 'project', '--no-git', '--no-install']);
  const root = path.join(cwd, 'project');
  const inner = path.join(root, 'deep');
  fs.mkdirSync(inner);
  const before = snapshot(root);
  const restored = run(inner, ['install', '--json']);
  assert.equal(restored.status, 0, restored.stderr);
  assert.equal(restored.json.action, 'install');
  assert.equal(restored.json.kernel.action, 'installed');
  assert.deepEqual(restored.json.written, [KERNEL]);
  const after = snapshot(root);
  delete after[KERNEL];
  assert.deepEqual(after, before);
  assert.equal(fs.statSync(path.join(root, KERNEL)).mode & 0o777, 0o755);
  const again = run(cwd, ['install', '--project', 'project', '--json']);
  assert.equal(again.json.kernel.action, 'unchanged');
  assert.deepEqual(again.json.written, []);
  assert.equal(run(cwd, ['install']).status, 3);
  for (const args of [['install', 'project'], ['install', '--no-install'], ['install', '--dry-run'], ['install', '--agents', 'codex']]) {
    assert.equal(run(root, args).status, 2, args.join(' '));
  }
});

test('install refuses another Kernel version, changes nothing, and prints the matching command', t => {
  const cwd = tempDir(t);
  run(cwd, ['create', 'project', '--no-git', '--no-install']);
  const root = path.join(cwd, 'project');
  const inventory = JSON.parse(read(root, '.accrete/template-install.json'));
  inventory.kernel_version = '0.0.9';
  inventory.template_version = '0.0.7';
  fs.writeFileSync(path.join(root, '.accrete/template-install.json'), JSON.stringify(inventory));
  const before = snapshot(root);
  const refused = run(root, ['install']);
  assert.equal(refused.status, 4);
  assert.ok(refused.stderr.includes('npx accrete-kit@0.0.7 install'));
  assert.ok(refused.stderr.includes('Kernel 0.0.9'));
  assert.deepEqual(snapshot(root), before);
});

test('upgrade moves the binary and the recorded version; a rerun leaves a working binary alone', t => {
  const cwd = tempDir(t);
  run(cwd, ['create', 'project', '--no-git']);
  const root = path.join(cwd, 'project');
  const place = body => fs.writeFileSync(path.join(root, KERNEL), body, { mode: 0o755 });
  const inventory = JSON.parse(read(root, '.accrete/template-install.json'));
  inventory.kernel_version = '0.0.9';
  fs.writeFileSync(path.join(root, '.accrete/template-install.json'), JSON.stringify(inventory));
  place(stubKernel('0.0.9'));

  const preview = run(root, ['upgrade', '--dry-run', '--json']);
  assert.equal(preview.json.kernel.action, 'would-install');
  assert.equal(read(root, KERNEL), stubKernel('0.0.9'));

  const moved = run(root, ['upgrade', '--json']);
  assert.equal(moved.status, 0, moved.stderr);
  assert.equal(moved.json.kernel.action, 'installed');
  assert.equal(read(root, KERNEL), stubKernel(DECLARED));
  assert.equal(JSON.parse(read(root, '.accrete/template-install.json')).kernel_version, DECLARED);

  // Other bytes that run as the declared version are a working binary.
  const handBuilt = `${stubKernel(DECLARED)}# built here\n`;
  place(handBuilt);
  assert.equal(run(root, ['upgrade', '--json']).json.kernel.action, 'unchanged');
  assert.equal(read(root, KERNEL), handBuilt);

  place('#!/bin/sh\nexit 1\n');
  assert.equal(run(root, ['upgrade', '--json']).json.kernel.action, 'installed');
  assert.equal(read(root, KERNEL), stubKernel(DECLARED));

  // --no-install records the version and leaves the binary for install to move.
  place(stubKernel('0.0.9'));
  const skipped = run(root, ['upgrade', '--no-install', '--json']);
  assert.equal(skipped.json.kernel.action, 'skipped');
  assert.equal(read(root, KERNEL), stubKernel('0.0.9'));
  assert.equal(run(root, ['install', '--json']).json.kernel.action, 'installed');
});

test('a symbolic link at the Kernel path is not followed', t => {
  const cwd = tempDir(t);
  run(cwd, ['create', 'project', '--no-git', '--no-install']);
  const root = path.join(cwd, 'project');
  const outside = path.join(cwd, 'outside');
  fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(root, '.accrete/bin'));
  const refused = run(root, ['upgrade', '--json']);
  assert.equal(refused.status, 7);
  assert.equal(refused.json.failed[0].destination, KERNEL);
  assert.equal(run(root, ['install']).status, 4);
  assert.deepEqual(fs.readdirSync(outside), []);
});

test('an embedded Kernel that fails its digest or version check is not installed', t => {
  const cwd = tempDir(t);
  const copy = path.join(cwd, 'kit');
  const bin = kitCopy(copy);
  const index = path.join(copy, 'dist/kernel/kernel.json');
  const original = fs.readFileSync(index, 'utf8');
  fs.writeFileSync(index, JSON.stringify({ version: DECLARED, platforms: { [HOST]: { sha256: sha('other') } } }));
  const digest = run(cwd, ['create', 'a', '--no-git', '--json'], bin);
  assert.equal(digest.status, 7);
  assert.match(digest.json.failed[0].error, /digest/);
  assert.ok(!exists(path.join(cwd, 'a'), KERNEL));
  fs.writeFileSync(index, original.replace(`"version":"${DECLARED}"`, '"version":"9.9.9"'));
  const version = run(cwd, ['create', 'b', '--no-git', '--json'], bin);
  assert.equal(version.status, 7);
  assert.match(version.json.failed[0].error, /carries Kernel 9\.9\.9/);
});

test('upgrade from an older package exits 4 and writes nothing', t => {
  const cwd = tempDir(t);
  run(cwd, ['create', 'project', '--no-git', '--no-install']);
  const root = path.join(cwd, 'project');
  const inventory = JSON.parse(read(root, '.accrete/template-install.json'));
  inventory.template_version = '99.0.0';
  fs.writeFileSync(path.join(root, '.accrete/template-install.json'), JSON.stringify(inventory));
  const before = snapshot(root);
  const refused = run(root, ['upgrade']);
  assert.equal(refused.status, 4);
  assert.ok(refused.stderr.includes('template 99.0.0'));
  assert.ok(refused.stderr.includes(`accrete-kit ${JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")).version}`));
  assert.ok(refused.stderr.includes('npx accrete-kit@latest upgrade'));
  assert.deepEqual(snapshot(root), before);
});

test('upgrade finds the nearest Workspace, --project selects one, and absence is an error', t => {
  const cwd = tempDir(t);
  run(cwd, ['create', 'project', '--no-git', '--no-install']);
  const root = path.join(cwd, 'project');
  const inner = path.join(root, 'deep/inner');
  fs.mkdirSync(inner, { recursive: true });
  assert.equal(run(inner, ['upgrade', '--no-install', '--json']).json.project_root, root);
  assert.equal(run(cwd, ['upgrade', '--project', 'project', '--no-install', '--json']).json.project_root, root);
  const missing = run(cwd, ['upgrade', '--no-install']);
  assert.equal(missing.status, 3);
  assert.match(missing.stderr, /npx accrete-kit@latest create/);
  assert.equal(run(cwd, ['upgrade', '--project', 'absent']).status, 3);
});

test('create, upgrade and install are subcommands; anything else prints usage and exits nonzero', t => {
  const cwd = tempDir(t);
  for (const args of [[], ['my-project'], ['init', 'my-project'], ['--upgrade'], ['--name', 'x']]) {
    const refused = run(cwd, args);
    assert.notEqual(refused.status, 0, args.join(' '));
    assert.equal(refused.stdout, '');
    if (!args.includes('--upgrade')) assert.match(refused.stderr, /npx accrete-kit@latest create DIRECTORY/, args.join(' '));
  }
  for (const args of [['create'], ['create', 'a', 'b'], ['upgrade', 'project'], ['create', 'project', '--dry-run'],
    ['create', 'project', '--accept', 'x'], ['create', 'project', '--project', 'x'], ['upgrade', '--name', 'x'], ['upgrade', '--no-git']]) {
    assert.equal(run(cwd, args).status, 2, args.join(' '));
  }
  assert.equal(fs.readdirSync(cwd).length, 0);
  // A directory named upgrade is nothing special.
  const literal = run(cwd, ['create', 'upgrade', '--no-git', '--no-install', '--json']);
  assert.equal(literal.status, 0, literal.stderr);
  assert.equal(literal.json.project_root, path.join(cwd, 'upgrade'));
  assert.match(run(cwd, ['--help']).stdout, /npx accrete-kit@latest upgrade/);
  assert.match(run(cwd, ['--version']).stdout, /^accrete-kit \d/);
});

test('an argument error under --json is one JSON document on stderr', t => {
  const failed = run(tempDir(t), ['create', 'project', '--bogus', '--json']);
  assert.equal(failed.status, 2);
  assert.equal(failed.stdout, '');
  assert.equal(JSON.parse(failed.stderr).error.kind, 'invalid');
});
