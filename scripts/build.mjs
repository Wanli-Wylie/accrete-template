#!/usr/bin/env node
// Release assembly only. This program never initializes or upgrades a project.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const fail = message => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };
const posix = path.posix;
const options = { check: false, release: null, cliRange: null };

for (let i = 2; i < process.argv.length; i++) {
  const argument = process.argv[i];
  if (argument === '--check') options.check = true;
  else if (argument === '--release' || argument === '--cli-range') {
    const value = process.argv[++i];
    assert(value && !value.startsWith('--'), `Missing value for ${argument}`);
    options[argument === '--release' ? 'release' : 'cliRange'] = value;
  } else if (argument === '--help') {
    console.log('node scripts/build.mjs [--check] [--release VERSION --cli-range RANGE]\n'
      + 'Assemble assets under dist/. No installation target or project mutation is supported.');
    process.exit(0);
  } else fail(`Unknown build argument: ${argument}`);
}

assert(Boolean(options.release) === Boolean(options.cliRange),
  '--release and --cli-range must be supplied together');
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
if (options.release) assert(semver.test(options.release), 'Expected a semantic distribution version');
if (options.cliRange) assert(!/[\r\n\u0000]/.test(options.cliRange), 'CLI range must be a single line');

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
    'Generated from `contract/cli-v1.json` in accrete-template. These are template-side',
    'integration requirements. Check the installed binary\'s `--help` when working',
    'with an independently built CLI. Read [CLI semantics](cli-contract.md) for',
    'input fields, publication outcomes and compatibility.', '',
    'Use `--project PATH` to select the project explicitly and `--json` for receipts.',
    'The `--model`, `--tool`, `--data`, `--result` and `--memory` relation flags repeat.',
    'Metavariables in uppercase must be replaced with actual values.', ''];
  for (const command of catalog.commands) {
    lines.push(`## ${command.id}`, '', '```sh', command.usage, '```', '', command.effect, '', `Design basis: ${command.basis}.`, '');
  }
  return Buffer.from(`${lines.join('\n')}\n`);
}

// POSIX ustar, regular files only. All content is authored release text.
// Fixed metadata and gzip timestamp make source-equivalent builds reproducible
// with the same Node/zlib runtime.
function archive(files, prefix) {
  const blocks = [];
  const put = (buffer, value, offset, length) => {
    const bytes = Buffer.from(value, 'utf8');
    assert(bytes.length <= length, `Tar field is too long: ${value}`);
    bytes.copy(buffer, offset);
  };
  const octal = (buffer, number, offset, length) => put(buffer, `${number.toString(8).padStart(length - 1, '0')}\0`, offset, length);
  for (const [relative, bytes] of [...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    const full = portable(`${prefix}/${relative}`);
    let name = full;
    let parent = '';
    if (Buffer.byteLength(full) > 100) {
      const splits = [...full.matchAll(/\//g)].map(m => m.index).reverse();
      const split = splits.find(i => Buffer.byteLength(full.slice(0, i)) <= 155 && Buffer.byteLength(full.slice(i + 1)) <= 100);
      assert(split !== undefined, `Path exceeds ustar capacity: ${full}`);
      parent = full.slice(0, split);
      name = full.slice(split + 1);
    }
    const header = Buffer.alloc(512);
    put(header, name, 0, 100);
    octal(header, 0o644, 100, 8);
    octal(header, 0, 108, 8);
    octal(header, 0, 116, 8);
    octal(header, bytes.length, 124, 12);
    octal(header, 0, 136, 12);
    header.fill(32, 148, 156);
    put(header, '0', 156, 1);
    put(header, 'ustar\0', 257, 6);
    put(header, '00', 263, 2);
    put(header, parent, 345, 155);
    const checksum = header.reduce((sum, value) => sum + value, 0);
    put(header, `${checksum.toString(8).padStart(6, '0')}\0 `, 148, 8);
    blocks.push(header, bytes, Buffer.alloc((512 - bytes.length % 512) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks), { level: 9 });
}

async function writeTree(directory, files) {
  for (const [relative, bytes] of files) {
    const target = path.join(directory, portable(relative));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes, { mode: 0o644 });
  }
}

async function main() {
  const [pkg, definition, catalog] = await Promise.all([
    readJson('package.json'), readJson('template.json'), readJson('contract/cli-v1.json')
  ]);
  assert(semver.test(pkg.version), 'Invalid template package version');
  assert(definition.schema_version === 1, 'Unsupported template definition');
  assert(definition.cli_contract === catalog.contract_id, 'CLI contract identity mismatch');
  assert(new Set(catalog.commands.map(c => c.id)).size === catalog.commands.length, 'Duplicate command IDs');
  assert(definition.skills.length === 5 && new Set(definition.skills).size === 5, 'Expected five distinct foundational Skills');
  const profiles = Object.keys(definition.profiles);
  assert(definition.default_profiles.every(p => profiles.includes(p)), 'Unknown default host profile');
  const bundle = new Map();
  const entries = [];
  const destinations = new Set();

  function addAsset(source, bytes, destination, profile = null, ownership = 'managed-file', markers = null) {
    portable(source); portable(destination);
    assert(!destinations.has(destination.toLowerCase()), `Case-insensitive destination collision: ${destination}`);
    destinations.add(destination.toLowerCase());
    if (bundle.has(source)) assert(bundle.get(source).equals(bytes), `Two meanings for asset ${source}`);
    else bundle.set(source, bytes);
    const entry = { source, destination, profile, ownership, sha256: hash(bytes), size: bytes.length, mode: '0644' };
    if (markers) entry.block = { start: markers.start, end: markers.end, sha256: hash(blockContent(bytes, markers, destination)) };
    entries.push(entry);
  }

  const templateFiles = await walk('template');
  for (const source of templateFiles) {
    const destination = source.slice('template/'.length);
    const bytes = await fs.readFile(path.join(root, source));
    assert(!bytes.includes(0), `Binary source unexpected: ${source}`);
    assert(!bytes.toString('utf8').includes('\r'), `Release text must use LF: ${source}`);
    const markers = definition.ownership.managed_blocks.find(b => b.path === destination);
    const ownership = markers ? 'managed-block' : definition.ownership.seed_once.includes(destination) ? 'seed-once' : 'managed-file';
    addAsset(`assets/${source}`, bytes, destination, definition.ownership.profile_files[destination] ?? null, ownership, markers);
  }
  for (const markers of definition.ownership.managed_blocks) assert(entries.some(e => e.destination === markers.path), `Missing block file: ${markers.path}`);
  for (const seed of definition.ownership.seed_once) assert(entries.some(e => e.destination === seed), `Missing seed file: ${seed}`);

  for (const name of definition.skills) {
    const files = await walk(`skills/${name}`);
    const entryBytes = await fs.readFile(path.join(root, `skills/${name}/SKILL.md`));
    validateSkill(name, files, entryBytes);
    for (const source of files) {
      const bytes = await fs.readFile(path.join(root, source));
      assert(!bytes.toString('utf8').includes('\r'), `Release text must use LF: ${source}`);
      for (const profile of profiles) {
        const relative = source.slice(`skills/${name}/`.length);
        addAsset(`assets/${source}`, bytes, `${definition.profiles[profile].skills_destination}/${name}/${relative}`, profile);
      }
    }
  }

  const release = {
    template_id: definition.template_id,
    template_version: pkg.version,
    distribution_version: options.release,
    cli_version_range: options.cliRange,
    compatibility_status: options.release ? 'declared-by-integrating-release' : 'unbound-template',
    cli_contract: catalog.contract_id,
    project_formats: definition.project_formats,
    architecture_edition: catalog.architecture_edition
  };
  addAsset('assets/generated/cli-commands.md', commandManual(catalog), '.accrete/docs/cli-commands.md');
  addAsset('assets/generated/release.json', json(release), '.accrete/release.json');
  addAsset('contract/cli-v1.json', json(catalog), '.accrete/contracts/cli-v1.json');
  const draftSchema = await readJson('contract/input-drafts.schema.json');
  const exampleMap = await readJson('contract/example-inputs.json');
  assert(Array.isArray(exampleMap), 'Expected an example-to-schema mapping array');
  const installedExamples = [];
  for (const example of exampleMap) {
    portable(example.file);
    assert(example.file.startsWith('template/.accrete/examples/'), `Unexpected caller draft source: ${example.file}`);
    const definition = draftSchema.$defs?.[example.definition];
    assert(definition, `Unknown caller draft definition: ${example.definition}`);
    const value = await readJson(example.file);
    for (const field of definition.required ?? []) assert(Object.hasOwn(value, field), `Caller draft ${example.file} lacks ${field}`);
    installedExamples.push({ file: example.file.slice('template/'.length), definition: example.definition });
  }
  addAsset('contract/input-drafts.schema.json', json(draftSchema), '.accrete/contracts/input-drafts.schema.json');
  addAsset('contract/example-inputs.json', json(installedExamples), '.accrete/contracts/example-inputs.json');
  for (const file of ['config/defaults.toml', 'schemas/bundle.schema.json', 'schemas/template-definition.schema.json']) {
    bundle.set(file, await fs.readFile(path.join(root, file)));
  }
  for (const [relative, bytes] of bundle) {
    if (relative.endsWith('.json')) JSON.parse(bytes.toString('utf8'));
  }
  const preview = new Map(entries.map(e => [e.destination, bundle.get(e.source)]));
  for (const selected of [[], ['codex'], ['claude'], profiles]) {
    const installed = new Map(entries.filter(e => !e.profile || selected.includes(e.profile)).map(e => [e.destination, bundle.get(e.source)]));
    validateLinks(installed, selected.join('+') || 'no-host');
  }
  assert(!preview.has('.accrete/project.toml'), 'Project identity/configuration must be created by native init');

  const manifest = {
    schema_version: 1, ...release,
    default_profiles: definition.default_profiles,
    profiles: definition.profiles,
    initialization: definition.initialization,
    upgrade: definition.upgrade,
    files: entries.sort((a, b) => a.destination < b.destination ? -1 : a.destination > b.destination ? 1 : 0)
  };
  bundle.set('manifest.json', json(manifest));
  const checksumText = [...bundle].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([file, bytes]) => `${hash(bytes)}  ${file}`).join('\n');
  bundle.set('SHA256SUMS', Buffer.from(`${checksumText}\n`));
  const id = `accrete-template-${pkg.version}`;
  const packed = archive(bundle, id);
  const summary = {
    template_version: pkg.version,
    distribution_version: options.release,
    compatibility_status: release.compatibility_status,
    source_skills: definition.skills.length,
    installed_files: entries.length,
    canonical_bundle_files: bundle.size,
    commands: catalog.commands.length,
    caller_drafts: exampleMap.length,
    build_runtime: { node: process.version, zlib: process.versions.zlib },
    archive: `${id}.tar.gz`,
    archive_sha256: hash(packed),
    checks: ['JSON parsing and caller draft mapping', 'Skill frontmatter and references', 'no foundational operation scripts',
      'managed block boundaries', 'portable unique destinations', 'links for none/codex/claude/both profiles', 'deterministic release digests']
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
  await fs.mkdir(dist, { recursive: true });
  const bundleDirectory = path.join(dist, id);
  const previewDirectory = path.join(dist, 'preview');
  await fs.rm(bundleDirectory, { recursive: true, force: true });
  await fs.rm(previewDirectory, { recursive: true, force: true });
  await writeTree(bundleDirectory, bundle);
  preview.set('PREVIEW.md', Buffer.from('# ACCRETE guidance preview\n\nThis build artifact contains the default host guidance layout. It has no project\nidentity, active configuration, object descriptors or index. Native `accrete init`\ncreates those when integrated with the CLI. Do not use this preview as an initialized\nproject or copy it over an existing project. Edit the canonical repository sources.\n'));
  await writeTree(previewDirectory, preview);
  await fs.writeFile(path.join(dist, `${id}.tar.gz`), packed);
  await fs.writeFile(path.join(dist, `${id}.tar.gz.sha256`), `${hash(packed)}  ${id}.tar.gz\n`);
  await fs.writeFile(path.join(dist, 'build-report.json'), json(summary));
  console.log(JSON.stringify({ ...summary, output_written: true, directory: `dist/${id}` }, null, 2));
}

main().catch(error => {
  console.error(`Template build: ${error.message}`);
  process.exitCode = 1;
});
