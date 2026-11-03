// A small scaffold on disk, as the build writes one, and a Workspace made from it.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadScaffold } from '../lib/scaffold.mjs';
import { createWorkspace, upgradeWorkspace } from '../lib/workspace.mjs';

export const BEGIN = '<!-- accrete:begin -->';
export const END = '<!-- accrete:end -->';
export const sha = text => createHash('sha256').update(text).digest('hex');
export const block = body => `${BEGIN}\n${body}\n${END}\n`;

export const DEFAULTS = 'format = 1\ntimezone = "UTC"\n\n[paths]\nmetadata = ".accrete/objects"\nresults = "results"\nmemory = "memory"\ntool_sources = "tools"\nscratch = "scratch"\n';

export function tempDir(t) {
  const directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'accrete-test-')));
  t.after(() => {
    fs.chmodSync(directory, 0o755);
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return directory;
}

/** `[destination, profile, ownership, body]` as a scaffold directory. */
export function writeScaffold(directory, version, files, change = () => {}) {
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(path.join(directory, 'config'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'config/defaults.toml'), DEFAULTS);
  const entries = files.map(([destination, profile, ownership, body]) => {
    const source = `assets/${destination.replaceAll('/', '_')}`;
    fs.mkdirSync(path.join(directory, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(directory, source), body);
    const entry = { source, destination, profile, ownership, sha256: sha(body), size: Buffer.byteLength(body) };
    if (ownership === 'managed-block') {
      const start = body.indexOf(BEGIN);
      const end = body.indexOf(END) + END.length + 1;
      entry.block = { start: BEGIN, end: END, sha256: sha(body.slice(start, end)) };
    }
    return entry;
  });
  const manifest = {
    schema_version: 1,
    template_id: 'accrete-foundation',
    template_version: version,
    kernel_version: '1.0.0',
    project_formats: { min: 1, max: 1 },
    default_profiles: ['codex', 'claude'],
    profiles: { codex: { skills_destination: '.agents/skills' }, claude: { skills_destination: '.claude/skills' } },
    files: entries
  };
  change(manifest);
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest));
  return directory;
}

export const release = label => [
  ['AGENTS.md', null, 'managed-block', `# Project\n\n${block(label)}\nOwner prose\n`],
  ['guide.md', null, 'managed-file', `guide ${label}\n`],
  ['seed.md', null, 'seed-once', `seed ${label}\n`],
  ['.agents/skills/s/SKILL.md', 'codex', 'managed-file', `codex ${label}\n`],
  ['.claude/skills/s/SKILL.md', 'claude', 'managed-file', `claude ${label}\n`]
];

export const action = (receipt, destination) => receipt.files.find(file => file.destination === destination)?.action;

/** A Workspace installed from a small scaffold, with one asset of each kind. */
export function fixture(t) {
  const directory = tempDir(t);
  const root = path.join(directory, 'project');
  const scaffoldDirectory = path.join(directory, 'scaffold');
  writeScaffold(scaffoldDirectory, '1.0.0', release('one'));
  createWorkspace(root, { id: 'fixture', git: false, install: false }, loadScaffold(scaffoldDirectory));
  const candidate = destination => `.accrete/template-upgrades/2.0.0/${destination}.incoming`;
  const self = {
    directory,
    root,
    scaffoldDirectory,
    candidate,
    release: (files, version = '2.0.0') => writeScaffold(scaffoldDirectory, version, files),
    upgrade: (options = {}) => upgradeWorkspace(root, { install: false, ...options }, loadScaffold(scaffoldDirectory)),
    path: relative => path.join(root, relative),
    read: relative => fs.readFileSync(path.join(root, relative), 'utf8'),
    write: (relative, text) => fs.writeFileSync(path.join(root, relative), text),
    remove: relative => fs.rmSync(path.join(root, relative)),
    exists: relative => fs.existsSync(path.join(root, relative)),
    inventory: () => JSON.parse(fs.readFileSync(path.join(root, '.accrete/template-install.json'), 'utf8')),
    entry: destination => self.inventory().files.find(file => file.destination === destination)
  };
  return self;
}

const REPO = fileURLToPath(new URL('..', import.meta.url));
export const DECLARED = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).accrete.cli;
export const HOST = `${process.platform}-${process.arch}`;
export const stubKernel = version => `#!/bin/sh\necho "accrete ${version}"\n`;

/**
 * A copy of the package with a stand-in Kernel for this host, so a run does not depend on
 * what dist/kernel/ holds. `kernel: false` is a package with nothing for this host.
 */
export function kitCopy(directory, { kernel = true } = {}) {
  fs.mkdirSync(directory, { recursive: true });
  for (const part of ['bin', 'lib', 'package.json', 'dist/scaffold']) fs.cpSync(path.join(REPO, part), path.join(directory, part), { recursive: true });
  if (kernel) {
    const body = stubKernel(DECLARED);
    fs.mkdirSync(path.join(directory, 'dist/kernel', HOST), { recursive: true });
    fs.writeFileSync(path.join(directory, 'dist/kernel', HOST, 'accrete'), body, { mode: 0o755 });
    fs.writeFileSync(path.join(directory, 'dist/kernel/kernel.json'), JSON.stringify({ version: DECLARED, platforms: { [HOST]: { sha256: sha(body) } } }));
  }
  return path.join(directory, 'bin/accrete-kit.mjs');
}

/** Every regular file under a directory, with its bytes. */
export function snapshot(root) {
  const found = {};
  const walk = directory => {
    for (const item of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
      const child = path.join(directory, item.name);
      if (item.isDirectory()) walk(child);
      else if (item.isFile()) found[path.relative(root, child)] = fs.readFileSync(child, 'latin1');
    }
  };
  walk(root);
  return found;
}
