// Ported from accrete-cli's tests/project_integration.rs, against small scaffolds.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadScaffold } from '../lib/scaffold.mjs';
import { createWorkspace, upgradeWorkspace } from '../lib/workspace.mjs';
import { BEGIN, END, action, block, fixture, release, sha, snapshot, tempDir, writeScaffold } from './support.mjs';

test('first install adopts, appends and preserves existing content', t => {
  const directory = tempDir(t);
  const files = [
    ...release('one'),
    ['CLAUDE.md', 'claude', 'managed-block', `${block('claude one')}\nTemplate prose\n`],
    ['other.md', null, 'managed-block', block('other one')],
    ['same.md', null, 'managed-file', 'same\n']
  ];
  const scaffold = loadScaffold(writeScaffold(path.join(directory, 'scaffold'), '1.0.0', files));
  const root = path.join(directory, 'project');
  fs.mkdirSync(root);
  const write = (name, text) => fs.writeFileSync(path.join(root, name), text);
  const read = name => fs.readFileSync(path.join(root, name), 'utf8');
  write('AGENTS.md', '# Mine\r\nkeep me');
  write('CLAUDE.md', `before\n${block('claude one')}after\n`);
  write('other.md', `${BEGIN}\n${BEGIN}\n${END}\n`);
  write('same.md', 'same\n');
  write('guide.md', 'my own guide\n');
  write('seed.md', 'my seed\n');

  const receipt = createWorkspace(root, { git: false, install: false }, scaffold);

  assert.equal(action(receipt, 'AGENTS.md'), 'append-block');
  assert.equal(read('AGENTS.md'), `# Mine\r\nkeep me\r\n\r\n${BEGIN}\r\none\r\n${END}\r\n`);
  assert.equal(action(receipt, 'CLAUDE.md'), 'adopt');
  assert.equal(read('CLAUDE.md'), `before\n${block('claude one')}after\n`);
  assert.equal(action(receipt, 'same.md'), 'adopt');
  assert.equal(action(receipt, 'seed.md'), 'keep-seed');
  assert.equal(read('seed.md'), 'my seed\n');
  // Both conflicts keep the owner's bytes and leave a candidate of the incoming unit.
  assert.equal(action(receipt, 'guide.md'), 'candidate');
  assert.equal(action(receipt, 'other.md'), 'candidate');
  assert.equal(read('guide.md'), 'my own guide\n');
  assert.equal(read('.accrete/template-upgrades/1.0.0/guide.md.incoming'), 'guide one\n');
  assert.equal(read('.accrete/template-upgrades/1.0.0/other.md.incoming'), block('other one'));
  assert.deepEqual(receipt.pending, ['guide.md', 'other.md']);
  assert.equal(receipt.ok, true);
  // The inventory does not claim a conflicted path was installed, and --accept can resolve it.
  const inventory = JSON.parse(read('.accrete/template-install.json'));
  const guide = inventory.files.find(file => file.destination === 'guide.md');
  assert.equal(guide.installed_version, null);
  assert.equal(guide.base_sha256, null);
  assert.equal(guide.pending.incoming_sha256, sha('guide one\n'));
  const accepted = upgradeWorkspace(root, { accept: 'guide.md', install: false }, scaffold);
  assert.deepEqual(accepted.pending, ['other.md']);
  assert.equal(read('guide.md'), 'my own guide\n');
});

test('clean units update and bytes outside a block are preserved', t => {
  const f = fixture(t);
  f.write('AGENTS.md', f.read('AGENTS.md').replace('# Project', '# My project'));
  const before = f.entry('guide.md');
  f.release(release('two'));
  const receipt = f.upgrade();
  assert.equal(receipt.ok, true);
  assert.equal(action(receipt, 'guide.md'), 'update');
  assert.equal(f.read('guide.md'), 'guide two\n');
  assert.equal(action(receipt, 'AGENTS.md'), 'update');
  assert.equal(f.read('AGENTS.md'), `# My project\n\n${block('two')}\nOwner prose\n`);
  assert.equal(f.entry('guide.md').installed_version, '2.0.0');
  assert.equal(f.entry('guide.md').base_sha256, sha('guide two\n'));
  // The old base has no remaining reference.
  assert.equal(f.exists(`.accrete/template-bases/${before.base_sha256}`), false);
  assert.equal(f.exists(`.accrete/template-bases/${sha('guide two\n')}`), true);
  assert.equal(action(f.upgrade(), 'guide.md'), 'unchanged');
});

test('an edited file gets a candidate and the rest of the upgrade continues', t => {
  const f = fixture(t);
  f.write('guide.md', 'owner guide\n');
  f.write('AGENTS.md', f.read('AGENTS.md').replace(block('one'), block('my block')));
  const base = f.entry('guide.md').base_sha256;
  f.release(release('two'));
  const receipt = f.upgrade();
  assert.equal(receipt.ok, true);
  assert.equal(action(receipt, 'guide.md'), 'candidate');
  assert.deepEqual(receipt.pending, ['AGENTS.md', 'guide.md']);
  assert.match(receipt.warning, /2 path\(s\)/);
  assert.equal(f.read('guide.md'), 'owner guide\n');
  assert.equal(f.read('.agents/skills/s/SKILL.md'), 'codex two\n');
  assert.equal(f.read(f.candidate('guide.md')), 'guide two\n');
  // A block file's candidate holds the block alone.
  assert.equal(f.read(f.candidate('AGENTS.md')), block('two'));
  const entry = f.entry('guide.md');
  assert.equal(entry.base_sha256, base);
  assert.equal(entry.installed_version, '1.0.0');
  assert.equal(entry.pending.candidate_path, f.candidate('guide.md'));
  assert.equal(entry.pending.current_sha256, sha('owner guide\n'));
  assert.equal(f.exists(`.accrete/template-bases/${base}`), true);
  assert.equal(f.inventory().template_version, '2.0.0');
});

test('edits matching the release or an unchanged asset need no candidate', t => {
  const f = fixture(t);
  f.write('guide.md', 'guide two\n');
  f.write('.agents/skills/s/SKILL.md', 'owner note\n');
  const files = release('two');
  files[3][3] = 'codex one\n';
  f.release(files);
  const receipt = f.upgrade();
  assert.equal(action(receipt, 'guide.md'), 'adopt');
  assert.equal(f.entry('guide.md').base_sha256, sha('guide two\n'));
  assert.equal(action(receipt, '.agents/skills/s/SKILL.md'), 'keep-edited');
  assert.equal(f.read('.agents/skills/s/SKILL.md'), 'owner note\n');
  assert.deepEqual(receipt.pending, []);
});

test('deletions stay deleted, removed markers count as one, and seeds belong to the project', t => {
  const f = fixture(t);
  f.remove('guide.md');
  f.remove('seed.md');
  f.write('AGENTS.md', '# Owner removed the block\n');
  f.release(release('two'));
  const receipt = f.upgrade();
  assert.equal(action(receipt, 'guide.md'), 'keep-deleted');
  assert.equal(action(receipt, 'AGENTS.md'), 'keep-deleted');
  assert.deepEqual(receipt.locally_deleted.sort(), ['AGENTS.md', 'guide.md']);
  assert.equal(f.exists('guide.md'), false);
  assert.equal(f.exists('seed.md'), false);
  assert.equal(f.read('AGENTS.md'), '# Owner removed the block\n');
  assert.equal(action(f.upgrade(), 'guide.md'), 'keep-deleted');
  assert.equal(f.exists('guide.md'), false);
  assert.equal(f.read('AGENTS.md'), '# Owner removed the block\n');
});

test('withdrawn paths are removed only when unchanged', t => {
  const f = fixture(t);
  f.write('seed.md', 'owner seed\n');
  f.write('AGENTS.md', `Owner\n${block('one')}`);
  f.release([
    ...release('two').filter(([destination]) => !['guide.md', 'seed.md', 'AGENTS.md'].includes(destination)),
    ['new.md', null, 'managed-file', 'new\n']
  ]);
  const receipt = f.upgrade();
  assert.equal(action(receipt, 'guide.md'), 'remove');
  assert.equal(f.exists('guide.md'), false);
  assert.equal(action(receipt, 'seed.md'), 'forget');
  assert.equal(f.read('seed.md'), 'owner seed\n');
  assert.equal(action(receipt, 'AGENTS.md'), 'remove-block');
  assert.equal(f.read('AGENTS.md'), 'Owner\n');
  assert.equal(f.read('new.md'), 'new\n');
  assert.equal(f.entry('guide.md'), undefined);

  const edited = fixture(t);
  edited.write('guide.md', 'edited\n');
  edited.release(release('two').filter(([destination]) => destination !== 'guide.md'));
  const detached = edited.upgrade();
  assert.equal(action(detached, 'guide.md'), 'detach');
  assert.deepEqual(detached.detached, ['guide.md']);
  assert.equal(edited.read('guide.md'), 'edited\n');
  assert.equal(edited.entry('guide.md'), undefined);
});

test('a new destination colliding with unmanaged content is preserved', t => {
  const f = fixture(t);
  f.write('new.md', 'unmanaged\n');
  fs.mkdirSync(f.path('dir.md'));
  f.release([...release('one'), ['new.md', null, 'managed-file', 'incoming\n'], ['dir.md', null, 'managed-file', 'incoming\n']]);
  const receipt = f.upgrade();
  assert.equal(action(receipt, 'new.md'), 'candidate');
  assert.equal(f.read('new.md'), 'unmanaged\n');
  assert.equal(action(receipt, 'dir.md'), 'candidate');
  assert.equal(fs.statSync(f.path('dir.md')).isDirectory(), true);
  assert.deepEqual(receipt.failed, []);
});

test('accept records the resolution and keeps the current bytes', t => {
  const f = fixture(t);
  f.write('guide.md', 'owner guide\n');
  f.release(release('two'));
  f.upgrade();
  const accept = (accepted, dryRun = false) => f.upgrade({ accept: accepted, dryRun });
  const conflict = accepted => assert.throws(() => accept(accepted), { kind: 'conflict' });

  assert.equal(accept('guide.md', true).dry_run, true);
  assert.ok(f.entry('guide.md').pending);
  conflict('seed.md');
  conflict('absent.md');
  // A changed proposal is detected.
  const candidate = f.candidate('guide.md');
  f.write(candidate, 'silently replaced\n');
  conflict('guide.md');
  f.write(candidate, 'guide two\n');
  // A proposal from another version is detected.
  const original = f.read('.accrete/template-install.json');
  const inventory = f.inventory();
  inventory.files.find(file => file.destination === 'guide.md').pending.version = '0.0.1';
  f.write('.accrete/template-install.json', JSON.stringify(inventory));
  conflict('guide.md');
  f.write('.accrete/template-install.json', original);

  f.write('guide.md', 'owner guide merged with two\n');
  assert.deepEqual(accept(f.path('guide.md')).pending, []);
  assert.equal(f.read('guide.md'), 'owner guide merged with two\n');
  const entry = f.entry('guide.md');
  assert.equal(entry.pending, null);
  assert.equal(entry.base_sha256, sha('guide two\n'));
  assert.equal(entry.installed_version, '2.0.0');
  assert.equal(f.exists(candidate), false);
  const again = f.upgrade();
  assert.equal(action(again, 'guide.md'), 'keep-edited');
  assert.equal(f.read('guide.md'), 'owner guide merged with two\n');
  assert.deepEqual(again.pending, []);
});

test('dry run reports the same decisions and writes nothing', t => {
  const f = fixture(t);
  f.write('guide.md', 'owner guide\n');
  f.release(release('two'));
  const before = snapshot(f.root);
  const preview = f.upgrade({ dryRun: true });
  assert.equal(preview.dry_run, true);
  assert.deepEqual(preview.written, []);
  assert.equal(preview.kernel.action, 'skipped');
  assert.deepEqual(snapshot(f.root), before);
  const applied = f.upgrade();
  for (const { destination, action: planned } of preview.files) assert.equal(planned, action(applied, destination));
});

test('dry run says would be, and the real run says were', t => {
  const f = fixture(t);
  f.write('guide.md', 'owner guide\n');
  f.release(release('two'));
  assert.match(f.upgrade({ dryRun: true }).warning, /^1 path\(s\) would be preserved/);
  assert.match(f.upgrade().warning, /^1 path\(s\) were preserved/);
});

test('an older package refuses to upgrade a newer Workspace and changes nothing', t => {
  const f = fixture(t);
  f.write('guide.md', 'owner guide\n');
  f.release(release('two'));
  f.upgrade();
  f.release(release('old'), '1.9.0');
  const before = snapshot(f.root);
  const refused = { kind: 'conflict', exitCode: 4, message: /template 2\.0\.0, newer than accrete-kit 1\.9\.0; use npx accrete-kit@latest upgrade/ };
  assert.throws(() => f.upgrade(), refused);
  assert.throws(() => f.upgrade({ dryRun: true }), refused);
  assert.throws(() => f.upgrade({ accept: 'guide.md' }), refused);
  assert.throws(() => f.upgrade({ agents: 'none' }), refused);
  assert.deepEqual(snapshot(f.root), before);
  // Equal versions still run: that is how --accept and reruns work.
  f.release(release('two'));
  assert.equal(f.upgrade({ accept: 'guide.md' }).ok, true);
  assert.equal(f.upgrade().ok, true);
});

test('upgrade keeps the selection, and explicit agents follow the withdrawal rules', t => {
  const f = fixture(t);
  f.write('.agents/skills/s/SKILL.md', 'owner codex skill\n');
  const none = f.upgrade({ agents: 'none' });
  assert.deepEqual(none.selected_profiles, []);
  assert.equal(action(none, '.claude/skills/s/SKILL.md'), 'remove');
  assert.equal(f.exists('.claude'), false);
  assert.equal(action(none, '.agents/skills/s/SKILL.md'), 'detach');
  assert.equal(f.read('.agents/skills/s/SKILL.md'), 'owner codex skill\n');
  assert.equal(f.exists('guide.md'), true);

  assert.deepEqual(f.upgrade().selected_profiles, []);
  assert.equal(f.exists('.claude'), false);

  assert.deepEqual(f.upgrade({ agents: 'claude' }).selected_profiles, ['claude']);
  assert.equal(f.read('.claude/skills/s/SKILL.md'), 'claude one\n');
});

test('a run killed at any publication finishes from the rules alone', t => {
  const child = fileURLToPath(new URL('crash-child.mjs', import.meta.url));
  // Edits, a withdrawal, a new file, a block update and a dropped agent in one run.
  const start = () => {
    const f = fixture(t);
    f.write('guide.md', 'owner guide\n');
    f.write('AGENTS.md', f.read('AGENTS.md').replace('# Project', '# Mine'));
    f.write('.claude/skills/s/SKILL.md', 'owner claude\n');
    f.release([
      ...release('two').filter(([destination]) => destination !== 'seed.md'),
      ['new.md', null, 'managed-file', 'new\n']
    ]);
    return f;
  };
  const whole = start();
  whole.upgrade({ agents: 'codex' });
  const expected = snapshot(whole.root);

  // From the second publication: the first is the selection itself, and a kill before
  // it leaves the old selection with nothing moved.
  let deaths = 0;
  for (let count = 1; count < 60; count += 1) {
    const f = start();
    const run = spawnSync(process.execPath, [child, f.root, f.scaffoldDirectory, 'codex', String(count)]);
    if (run.status === 0) break;
    assert.equal(run.status, 9, run.stderr.toString());
    deaths += 1;
    // The retry names no agents: the selection must have survived the kill.
    const receipt = f.upgrade();
    assert.deepEqual(receipt.selected_profiles, ['codex']);
    assert.deepEqual(receipt.locally_deleted, [], `killed at ${count}`);
    assert.equal(receipt.ok, true);
    assert.deepEqual(snapshot(f.root), expected, `killed at ${count}`);
  }
  assert.ok(deaths > 5, `only ${deaths} kill points were exercised`);
});

test('a per-path failure is reported per path, the rest finish, and a retry completes', t => {
  const f = fixture(t);
  f.release(release('two'));
  const locked = f.path('.agents/skills/s');
  fs.chmodSync(locked, 0o555);
  const receipt = f.upgrade();
  fs.chmodSync(locked, 0o755);
  assert.equal(receipt.ok, false);
  assert.deepEqual(receipt.failed.map(item => [item.destination, item.planned]), [['.agents/skills/s/SKILL.md', 'update']]);
  assert.match(receipt.failed[0].error, /EACCES/);
  assert.equal(f.read('guide.md'), 'guide two\n');
  assert.equal(f.read('.agents/skills/s/SKILL.md'), 'codex one\n');
  assert.equal(f.entry('.agents/skills/s/SKILL.md').installed_version, '1.0.0');
  const retry = f.upgrade();
  assert.equal(retry.ok, true);
  assert.equal(f.read('.agents/skills/s/SKILL.md'), 'codex two\n');
});

test('a scaffold that fails its checks is refused and changes nothing', t => {
  const directory = tempDir(t);
  const scaffoldDirectory = path.join(directory, 'scaffold');
  const refused = (kind, change) => {
    writeScaffold(scaffoldDirectory, '1.0.0', release('one'), change);
    assert.throws(() => loadScaffold(scaffoldDirectory), { kind });
  };
  refused('unsupported_format', m => { m.schema_version = 2; });
  refused('invalid', m => { m.files[1].sha256 = '0'.repeat(64); });
  refused('invalid', m => { m.files[1].destination = '../escape'; });
  refused('invalid', m => { m.files[1].destination = 'agents.MD'; });
  refused('invalid', m => { m.files[1].destination = 'guide.md/inner'; m.files[2].destination = 'guide.md'; });
  for (const kept of ['.git/config', '.accrete/project.toml', '.accrete/local.toml', '.accrete/objects/x', '.accrete/data/x',
    '.accrete/migrations/x', '.accrete/template-install.json', '.accrete/template-bases/x', '.accrete/template-upgrades/x',
    '.accrete/bin/accrete']) {
    refused('invalid', m => { m.files[1].destination = kept; });
  }
  assert.throws(() => loadScaffold(path.join(directory, 'absent')), { kind: 'invalid' });
});

test('a destination overlapping a configured store is refused', t => {
  const f = fixture(t);
  f.write('.accrete/project.toml', f.read('.accrete/project.toml').replace('results = "results"', 'results = ".agents/skills"'));
  f.release(release('two'));
  assert.throws(() => f.upgrade(), { kind: 'invalid' });
});

test('an unsupported Workspace format is refused before anything is written', t => {
  const f = fixture(t);
  f.write('.accrete/project.toml', f.read('.accrete/project.toml').replace('format = 1', 'format = 2'));
  f.release(release('two'));
  const before = snapshot(f.root);
  assert.throws(() => f.upgrade(), { kind: 'unsupported_format' });
  assert.throws(() => f.upgrade({ accept: 'guide.md' }), { kind: 'unsupported_format' });
  assert.throws(() => createWorkspace(f.root, { git: false, install: false }, loadScaffold(f.scaffoldDirectory)), { kind: 'unsupported_format' });
  assert.deepEqual(snapshot(f.root), before);
});

test('symbolic links are never followed', t => {
  const f = fixture(t);
  const outside = path.join(f.directory, 'outside');
  fs.mkdirSync(outside);
  fs.rmSync(f.path('.agents'), { recursive: true });
  fs.symlinkSync(outside, f.path('.agents'));
  f.release(release('two'));
  const receipt = f.upgrade();
  assert.equal(action(receipt, '.agents/skills/s/SKILL.md'), 'candidate');
  assert.deepEqual(fs.readdirSync(outside), []);

  const linked = fixture(t);
  fs.symlinkSync(outside, linked.path('.accrete/template-upgrades'));
  linked.release(release('two'));
  assert.throws(() => linked.upgrade(), { kind: 'conflict' });

  const directory = tempDir(t);
  const root = path.join(directory, 'project');
  fs.mkdirSync(root);
  fs.symlinkSync(outside, path.join(root, '.accrete'));
  assert.throws(() => createWorkspace(root, { git: false, install: false }, loadScaffold(f.scaffoldDirectory)), { kind: 'conflict' });
  assert.deepEqual(fs.readdirSync(outside), []);
});
