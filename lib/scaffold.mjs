// The assembled scaffold shipped in this package: a manifest and its assets.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AccreteError, checkRelative, sha256 } from './fsutil.mjs';

export const MARKER = '.accrete/project.toml';
export const INVENTORY = '.accrete/template-install.json';
export const BASES = '.accrete/template-bases';
export const UPGRADES = '.accrete/template-upgrades';

const TEMPLATE_ID = 'accrete-foundation';
// The Kernel's paths, this host's Kernel binary, and this generator's own state.
const PROTECTED = [
  '.git', MARKER, '.accrete/local.toml', '.accrete/objects', '.accrete/data', '.accrete/migrations',
  '.accrete/bin', INVENTORY, BASES, UPGRADES
];
const OWNERSHIP = ['managed-file', 'managed-block', 'seed-once'];
const invalid = message => new AccreteError('invalid', message);

export const within = (destination, parent) => destination === parent || destination.startsWith(`${parent}/`);

/**
 * Exactly one ordered pair of full-line markers, including the end line's
 * terminator. Returns `none`, `malformed`, or the byte range of the block.
 */
export function findBlock(bytes, start, end) {
  const starts = [];
  const ends = [];
  let offset = 0;
  while (offset < bytes.length) {
    const newline = bytes.indexOf(0x0a, offset);
    const next = newline === -1 ? bytes.length : newline + 1;
    const line = bytes.toString('latin1', offset, newline === -1 ? bytes.length : newline).replace(/\r$/, '');
    if (line === start) starts.push(offset);
    if (line === end) ends.push(next);
    offset = next;
  }
  if (starts.length === 0 && ends.length === 0) return { kind: 'none' };
  if (starts.length === 1 && ends.length === 1 && starts[0] < ends[0]) return { kind: 'one', start: starts[0], end: ends[0] };
  return { kind: 'malformed' };
}

function checkEntry(manifest, entry, files) {
  checkRelative(entry.source);
  checkRelative(entry.destination);
  if (PROTECTED.some(parent => within(entry.destination, parent))) {
    throw invalid(`Scaffold destination overlaps Workspace state: ${entry.destination}`);
  }
  if (entry.profile !== null && !Object.hasOwn(manifest.profiles, entry.profile)) {
    throw invalid(`${entry.destination} names unknown profile ${entry.profile}`);
  }
  if (!OWNERSHIP.includes(entry.ownership)) throw invalid(`${entry.destination} has unknown ownership ${entry.ownership}`);
  const bytes = files.get(entry.source);
  if (bytes.length !== entry.size || sha256(bytes) !== entry.sha256) {
    throw invalid(`Scaffold asset does not match its manifest: ${entry.source}`);
  }
  if ((entry.ownership === 'managed-block') !== Boolean(entry.block)) {
    throw invalid(`Only a managed block entry has markers, and it must have them: ${entry.destination}`);
  }
  if (entry.block) {
    const block = findBlock(bytes, entry.block.start, entry.block.end);
    if (block.kind !== 'one' || sha256(bytes.subarray(block.start, block.end)) !== entry.block.sha256) {
      throw invalid(`Scaffold block does not match its markers and digest: ${entry.source}`);
    }
  }
}

export function loadScaffold(directory = fileURLToPath(new URL('../dist/scaffold', import.meta.url))) {
  let manifest;
  let defaults;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
    defaults = fs.readFileSync(path.join(directory, 'config/defaults.toml'), 'utf8');
  } catch (error) {
    throw invalid(`Cannot read the scaffold in ${directory}; run npm run build: ${error.message}`);
  }
  if (manifest.schema_version !== 1 || manifest.template_id !== TEMPLATE_ID) {
    throw new AccreteError('unsupported_format', `Unsupported scaffold ${manifest.template_id} schema ${manifest.schema_version}`);
  }
  const files = new Map();
  for (const { source } of manifest.files) {
    if (files.has(source)) continue;
    try {
      files.set(checkRelative(source), fs.readFileSync(path.join(directory, source)));
    } catch (error) {
      if (error instanceof AccreteError) throw error;
      throw invalid(`Scaffold asset is missing: ${source}`);
    }
  }
  const seen = new Set();
  for (const entry of manifest.files) {
    checkEntry(manifest, entry, files);
    const folded = entry.destination.toLowerCase();
    if (seen.has(folded)) throw invalid(`Scaffold destination repeats ignoring case: ${entry.destination}`);
    seen.add(folded);
  }
  for (const a of seen) {
    for (const b of seen) {
      if (a !== b && within(b, a)) throw invalid(`Scaffold destinations overlap: ${a} and ${b}`);
    }
  }
  return {
    ...manifest,
    defaults,
    kernelDirectory: path.join(directory, '..', 'kernel'),
    read: source => files.get(source),
    // The update unit of an asset: its managed section, or the whole file.
    unit(asset) {
      const bytes = files.get(asset.source);
      if (!asset.block) return bytes;
      const block = findBlock(bytes, asset.block.start, asset.block.end);
      return bytes.subarray(block.start, block.end);
    }
  };
}

/** `codex,claude`, `codex`, `claude` or `none`, in the manifest's order. */
export function parseAgents(scaffold, text) {
  if (text === 'none') return [];
  const wanted = new Set(text.split(','));
  for (const name of wanted) {
    if (!Object.hasOwn(scaffold.profiles, name)) {
      throw invalid(`--agents takes codex,claude, codex, claude or none; unknown host ${JSON.stringify(name)}`);
    }
  }
  const ordered = scaffold.default_profiles.filter(name => wanted.has(name));
  return [...ordered, ...[...wanted].filter(name => !ordered.includes(name))];
}
