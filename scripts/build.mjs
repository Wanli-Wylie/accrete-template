#!/usr/bin/env node
// Assemble and check the scaffold that accrete-kit ships. Workspace creation
// and upgrades are lib/; this program only reads this repository and writes dist/scaffold/.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const fail = message => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };
const posix = path.posix;
const options = { check: false };

for (const argument of process.argv.slice(2)) {
  if (argument === '--check') options.check = true;
  else if (argument === '--help') {
    console.log('node scripts/build.mjs [--check]\nAssemble the scaffold under dist/scaffold, or with --check only verify the sources.');
    process.exit(0);
  } else fail(`Unknown build argument: ${argument}`);
}

const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function portable(relative) {
  assert(typeof relative === 'string' && relative.length > 0, 'Empty asset path');
  assert(!relative.includes('\\') && !relative.includes('\0') && !relative.includes(':'), `Nonportable path: ${relative}`);
  assert(!posix.isAbsolute(relative) && !relative.split('/').some(p => p === '..' || p === '' || p === '.'), `Unsafe relative path: ${relative}`);
  return relative;
}

async function readJson(relative) {
  return JSON.parse(await fs.readFile(path.join(root, portable(relative)), 'utf8'));
}

async function walk(relative) {
  const directory = path.join(root, portable(relative));
  const stat = await fs.lstat(directory);
  assert(stat.isDirectory() && !stat.isSymbolicLink(), `Release source must be an ordinary directory: ${relative}`);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    if (entry.name === '.DS_Store') continue;
    const child = `${relative}/${entry.name}`;
    assert(!entry.isSymbolicLink(), `Release sources must be real files/directories: ${child}`);
    if (entry.isDirectory()) files.push(...await walk(child));
    else if (entry.isFile()) files.push(child);
    else fail(`Unsupported source type: ${child}`);
  }
  return files;
}

function blockContent(bytes, markers, label) {
  const text = bytes.toString('utf8');
  const lines = text.split('\n');
  const starts = lines.flatMap((line, i) => line === markers.start ? [i] : []);
  const ends = lines.flatMap((line, i) => line === markers.end ? [i] : []);
  assert(starts.length === 1 && ends.length === 1 && starts[0] < ends[0], `Expected exactly one ordered managed block in ${label}`);
  return Buffer.from(`${lines.slice(starts[0], ends[0] + 1).join('\n')}\n`);
}

function validateSkill(name, files, bytes) {
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) && name.length <= 64, `Invalid Skill name: ${name}`);
  const text = bytes.toString('utf8');
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  assert(frontmatter, `Missing Skill frontmatter: ${name}`);
  const fields = [...frontmatter[1].matchAll(/^([a-z_]+):/gm)].map(m => m[1]);
  assert(fields.length === 2 && fields.includes('name') && fields.includes('description'), `Use name and description only: ${name}`);
  assert(new RegExp(`^name: (?:${name}|"${name}"|'${name}')$`, 'm').test(frontmatter[1]), `Skill name/folder mismatch: ${name}`);
  const description = frontmatter[1].replace(/^name:.*\n?/m, '').replace(/^description:\s*/, '').trim();
  assert(description.length > 20 && description.length <= 1024, `Unhelpful or oversized Skill description: ${name}`);
  assert(text.split('\n').length < 500, `Keep the Skill entry concise: ${name}`);
  assert(files.some(f => f.includes('/references/')), `Missing Skill references: ${name}`);
  for (const file of files) {
    assert(!file.includes('/scripts/'), `Foundation cannot contain operation scripts: ${file}`);
    assert(!/\.(?:py|sh|bash|mjs|cjs|js|ts|ps1|exe)$/i.test(file), `Executable foundation asset: ${file}`);
  }
}

function validateLinks(installed, profileLabel) {
  for (const [destination, bytes] of installed) {
    if (!destination.endsWith('.md')) continue;
    const prose = bytes.toString('utf8').replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
    for (const match of prose.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const href = match[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#')) continue;
      const local = decodeURIComponent(href.split('#')[0]);
      const resolved = posix.normalize(posix.join(posix.dirname(destination), local));
      assert(installed.has(resolved), `Broken ${profileLabel} link: ${destination} -> ${href}`);
    }
  }
}

function commandManual(catalog) {
  const lines = ['# CLI command map', '',
    'Generated from the command catalog of this ACCRETE release. Read',
    '[CLI semantics](cli-contract.md) for input fields, publication outcomes and',
    'recovery, and `accrete COMMAND --help` for the same flags at the terminal.', '',
    'Creating a Workspace and upgrading its template files are not `accrete` commands:',
    'see [the generator](cli-contract.md#workspace-creation-and-template-upgrades).', '',
    'Use `--project DIRECTORY` to select the Workspace explicitly and `--json` for receipts.',
    'Uppercase metavariables must be replaced with actual values. Object arguments',
    'accept a stable ID, a name or an alias. These flags repeat: `--result`, `--model`,',
    '`--tool`, `--data` and `--supersedes` on `memory append`, `--commit` on',
    '`model iteration close`, `--source-scope` on `model register`, `--path` on',
    '`result capture`, and `--id` on `export`.', ''];
  for (const command of catalog.commands) {
    lines.push(`## ${command.id}`, '', '```sh', command.usage, '```', '', command.effect, '');
  }
  return Buffer.from(`${lines.join('\n')}\n`);
}

async function writeTree(directory, files) {
  for (const [relative, bytes] of files) {
    const target = path.join(directory, portable(relative));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes, { mode: 0o644 });
  }
}

// npm drops a file named .gitignore from a package and applies it to its siblings,
// so the asset is stored under another name; the manifest maps it back.
const packedName = source => source.replace(/(^|\/)\.gitignore$/, '$1_gitignore');

async function main() {
  const [pkg, definition, catalog] = await Promise.all([
    readJson('package.json'), readJson('template.json'), readJson('contract/cli-v1.json')
  ]);
  assert(semver.test(pkg.version), 'Invalid package version');
  const kernelVersion = pkg.accrete?.cli;
  assert(semver.test(kernelVersion ?? ''), 'package.json accrete.cli must be an exact Kernel version');
  assert(/^[\w.-]+\/[\w.-]+$/.test(pkg.accrete.cliRepo ?? ''), 'package.json accrete.cliRepo must be owner/name');
  assert(!pkg.dependencies, 'accrete-kit has no npm dependencies; it carries the Kernel binaries');
  assert(definition.schema_version === 1, 'Unsupported template definition');
  assert(definition.cli_contract === catalog.contract_id, 'CLI contract identity mismatch');
  assert(new Set(catalog.commands.map(c => c.id)).size === catalog.commands.length, 'Duplicate command IDs');
  assert(definition.skills.length === 5 && new Set(definition.skills).size === 5, 'Expected five distinct foundational Skills');
  const profiles = Object.keys(definition.profiles);
  assert(definition.default_profiles.every(p => profiles.includes(p)), 'Unknown default host profile');
  const assets = new Map();
  const entries = [];
  const destinations = new Set();

  function addAsset(source, bytes, destination, profile = null, ownership = 'managed-file', markers = null) {
    const stored = `assets/${packedName(source)}`;
    portable(stored); portable(destination);
    assert(!destinations.has(destination.toLowerCase()), `Case-insensitive destination collision: ${destination}`);
    destinations.add(destination.toLowerCase());
    if (assets.has(stored)) assert(assets.get(stored).equals(bytes), `Two meanings for asset ${stored}`);
    else assets.set(stored, bytes);
    const entry = { source: stored, destination, profile, ownership, sha256: hash(bytes), size: bytes.length };
    if (markers) entry.block = { start: markers.start, end: markers.end, sha256: hash(blockContent(bytes, markers, destination)) };
    entries.push(entry);
  }

  const templateFiles = await walk('template');
  for (const source of templateFiles) {
    const destination = source.slice('template/'.length);
    const bytes = await fs.readFile(path.join(root, source));
    assert(!bytes.includes(0), `Binary source unexpected: ${source}`);
    assert(!bytes.toString('utf8').includes('\r'), `Package text must use LF: ${source}`);
    const markers = definition.ownership.managed_blocks.find(b => b.path === destination);
    const ownership = markers ? 'managed-block' : definition.ownership.seed_once.includes(destination) ? 'seed-once' : 'managed-file';
    if (destination === '.gitignore') {
      assert(blockContent(bytes, markers, destination).equals(bytes), 'The .gitignore block is the only source of rules in that file');
    }
    addAsset(source, bytes, destination, definition.ownership.profile_files[destination] ?? null, ownership, markers);
  }
  for (const markers of definition.ownership.managed_blocks) assert(entries.some(e => e.destination === markers.path), `Missing block file: ${markers.path}`);
  for (const seed of definition.ownership.seed_once) assert(entries.some(e => e.destination === seed), `Missing seed file: ${seed}`);

  for (const name of definition.skills) {
    const files = await walk(`skills/${name}`);
    const entryBytes = await fs.readFile(path.join(root, `skills/${name}/SKILL.md`));
    validateSkill(name, files, entryBytes);
    for (const source of files) {
      const bytes = await fs.readFile(path.join(root, source));
      assert(!bytes.toString('utf8').includes('\r'), `Package text must use LF: ${source}`);
      for (const profile of profiles) {
        const relative = source.slice(`skills/${name}/`.length);
        addAsset(source, bytes, `${definition.profiles[profile].skills_destination}/${name}/${relative}`, profile);
      }
    }
  }

  const release = {
    template_id: definition.template_id,
    template_version: pkg.version,
    kernel_version: kernelVersion,
    cli_contract: catalog.contract_id,
    project_formats: definition.project_formats,
    architecture_edition: catalog.architecture_edition
  };
  addAsset('generated/cli-commands.md', commandManual(catalog), '.accrete/docs/cli-commands.md');
  addAsset('generated/release.json', json(release), '.accrete/release.json');
  addAsset('contract/cli-v1.json', json(catalog), '.accrete/contracts/cli-v1.json');
  const draftSchema = await readJson('contract/input-drafts.schema.json');
  const exampleMap = await readJson('contract/example-inputs.json');
  assert(Array.isArray(exampleMap), 'Expected an example-to-schema mapping array');
  const installedExamples = [];
  for (const example of exampleMap) {
    portable(example.file);
    assert(example.file.startsWith('template/.accrete/examples/'), `Unexpected caller draft source: ${example.file}`);
    const draftDefinition = draftSchema.$defs?.[example.definition];
    assert(draftDefinition, `Unknown caller draft definition: ${example.definition}`);
    const value = await readJson(example.file);
    for (const field of draftDefinition.required ?? []) assert(Object.hasOwn(value, field), `Caller draft ${example.file} lacks ${field}`);
    installedExamples.push({ file: example.file.slice('template/'.length), definition: example.definition });
  }
  addAsset('contract/input-drafts.schema.json', json(draftSchema), '.accrete/contracts/input-drafts.schema.json');
  addAsset('contract/example-inputs.json', json(installedExamples), '.accrete/contracts/example-inputs.json');
  for (const [relative, bytes] of assets) {
    if (relative.endsWith('.json')) JSON.parse(bytes.toString('utf8'));
  }
  const defaults = await fs.readFile(path.join(root, 'config/defaults.toml'), 'utf8');
  for (const key of ['format', 'timezone']) assert(new RegExp(`^${key} = `, 'm').test(defaults), `config/defaults.toml lacks ${key}`);
  for (const selected of [[], ['codex'], ['claude'], profiles]) {
    const installed = new Map(entries.filter(e => !e.profile || selected.includes(e.profile)).map(e => [e.destination, assets.get(e.source)]));
    validateLinks(installed, selected.join('+') || 'no-host');
  }
  assert(!destinations.has('.accrete/project.toml'), 'The Workspace marker is written by the generator, not copied');

  const manifest = {
    schema_version: 1,
    ...release,
    default_profiles: definition.default_profiles,
    profiles: definition.profiles,
    files: entries.sort((a, b) => a.destination < b.destination ? -1 : a.destination > b.destination ? 1 : 0)
  };
  const summary = {
    template_version: pkg.version,
    kernel_version: kernelVersion,
    source_skills: definition.skills.length,
    installed_files: entries.length,
    stored_assets: assets.size,
    commands: catalog.commands.length,
    caller_drafts: exampleMap.length
  };
  if (options.check) {
    console.log(JSON.stringify({ ...summary, output_written: false }, null, 2));
    return;
  }
  const dist = path.join(root, 'dist');
  try {
    const stat = await fs.lstat(dist);
    assert(stat.isDirectory() && !stat.isSymbolicLink(), 'dist must be an ordinary build-output directory');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  // dist/kernel/ is fetch-kernel's and survives a build.
  const scaffold = path.join(dist, 'scaffold');
  await fs.rm(scaffold, { recursive: true, force: true });
  await writeTree(scaffold, assets);
  await writeTree(scaffold, new Map([['manifest.json', json(manifest)], ['config/defaults.toml', Buffer.from(defaults)]]));
  console.log(JSON.stringify({ ...summary, output_written: true, directory: 'dist/scaffold' }, null, 2));
}

main().catch(error => {
  console.error(`Template build: ${error.message}`);
  process.exitCode = 1;
});
