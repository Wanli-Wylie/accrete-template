// Ownership-aware installation. Every managed unit is compared three ways:
// C (current content), B (installed base) and N (incoming scaffold). Each path's
// decision is independent of the others, so repeating an interrupted run reaches
// the same outcome: what was published reads as C equals N, and the inventory
// that records it comes last. See docs/TEMPLATE-FORMAT.md.
import fs from 'node:fs';
import path from 'node:path';
import { AccreteError, atomicWrite, readCurrent, refuseSymlinks, removeWithEmptyParents, sha256 } from './fsutil.mjs';
import { BASES, INVENTORY, UPGRADES, findBlock, within } from './scaffold.mjs';

// Decisions that leave the project's own files as they are.
const KEEPS_FILES = new Set(['unchanged', 'adopt', 'keep-edited', 'keep-deleted', 'keep-seed']);

export function readInventory(root) {
  refuseSymlinks(root, INVENTORY);
  let text;
  try {
    text = fs.readFileSync(path.join(root, INVENTORY), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  let inventory;
  try {
    inventory = JSON.parse(text);
  } catch (error) {
    throw new AccreteError('unsupported_format', `Invalid template inventory: ${error.message}`);
  }
  if (inventory.schema_version !== 1) throw new AccreteError('unsupported_format', 'Unsupported template inventory schema');
  return inventory;
}

const currentDigest = current => current.kind === 'file' ? sha256(current.bytes) : null;

/** The managed unit in the current file: `missing`, `no-block`, `unusable`, or its bytes. */
function currentUnit(current, block) {
  if (current.kind === 'missing') return { kind: 'missing' };
  if (current.kind === 'other') return { kind: 'unusable' };
  if (!block) return { kind: 'present', start: 0, end: current.bytes.length, bytes: current.bytes };
  const found = findBlock(current.bytes, block.start, block.end);
  if (found.kind === 'none') return { kind: 'no-block' };
  if (found.kind === 'malformed') return { kind: 'unusable' };
  return { ...found, kind: 'present', bytes: current.bytes.subarray(found.start, found.end) };
}

/** LF scaffold text in the newline convention of `like`. */
function withNewlinesOf(text, like) {
  if (!like.includes('\r\n')) return text;
  return Buffer.from(text.toString('latin1').replaceAll('\n', '\r\n'), 'latin1');
}

const candidatePath = (scaffold, destination) => `${UPGRADES}/${scaffold.template_version}/${destination}.incoming`;

function decide(unit, base, currentSha, incomingSha, cleanEntry) {
  if (unit.kind === 'missing') return base ? 'keep-deleted' : 'install';
  if (unit.kind === 'no-block') return base ? 'keep-deleted' : 'append-block';
  if (unit.kind === 'unusable') return 'candidate';
  if (currentSha === incomingSha) return base === incomingSha && cleanEntry ? 'unchanged' : 'adopt';
  if (base === currentSha) return 'update';
  if (base === incomingSha) return 'keep-edited';
  return 'candidate';
}

function planAsset(root, scaffold, asset, entry) {
  const current = readCurrent(root, asset.destination);
  const step = { destination: asset.destination, asset, before: currentDigest(current), base: null, currentUnit: null };
  if (asset.ownership === 'seed-once') {
    return { ...step, act: !entry && current.kind === 'missing' ? 'seed' : 'keep-seed', incoming: scaffold.read(asset.source) };
  }
  const unit = currentUnit(current, asset.block);
  const canonical = scaffold.unit(asset);
  let incoming = canonical;
  if (asset.block && current.kind === 'file') incoming = withNewlinesOf(canonical, unit.bytes ?? current.bytes);
  const incomingSha = sha256(incoming);
  const currentSha = unit.kind === 'present' ? sha256(unit.bytes) : null;
  const base = entry?.ownership === asset.ownership ? entry.base_sha256 : null;
  const clean = Boolean(entry) && !entry.pending && !entry.locally_deleted;
  return { ...step, act: decide(unit, base, currentSha, incomingSha, clean), base, currentUnit: currentSha, incoming };
}

/** A path no longer installed: withdrawn by the scaffold, or its agent was dropped. */
function planWithdrawal(root, entry) {
  const current = readCurrent(root, entry.destination);
  const unit = currentUnit(current, entry.block);
  let act;
  if (entry.ownership === 'seed-once' || !entry.base_sha256) act = 'forget';
  else if (unit.kind === 'missing' || unit.kind === 'no-block') act = 'forget';
  else if (unit.kind === 'present' && sha256(unit.bytes) === entry.base_sha256) act = entry.block ? 'remove-block' : 'remove';
  else act = 'detach';
  return { destination: entry.destination, act, before: currentDigest(current), base: entry.base_sha256 };
}

function installedEntry(scaffold, asset, digest) {
  return {
    destination: asset.destination,
    profile: asset.profile,
    ownership: asset.ownership,
    installed_version: scaffold.template_version,
    base_sha256: digest,
    ...(asset.block ? { block: { start: asset.block.start, end: asset.block.end } } : {}),
    pending: null
  };
}

/** Records what one run changed, relative to the Workspace root. */
export function publisher(root) {
  const written = [];
  const removed = [];
  return {
    written,
    removed,
    write(relative, bytes, options) {
      atomicWrite(path.join(root, relative), bytes, options);
      written.push(relative);
    },
    remove(relative) {
      removeWithEmptyParents(root, relative);
      removed.push(relative);
    },
    // Content-addressed: an existing blob with this name already holds these bytes.
    base(bytes) {
      const digest = sha256(bytes);
      if (!fs.existsSync(path.join(root, BASES, digest))) this.write(`${BASES}/${digest}`, bytes);
      return digest;
    }
  };
}

/** The whole new file for a block or file unit, as this step decided. */
function newFileBytes(scaffold, step, current) {
  if (step.act === 'append-block') {
    const eol = current.bytes.includes('\r\n') ? '\r\n' : '\n';
    const parts = [current.bytes];
    if (current.bytes.length > 0) {
      if (current.bytes.at(-1) !== 0x0a) parts.push(Buffer.from(eol));
      parts.push(Buffer.from(eol));
    }
    return Buffer.concat([...parts, step.incoming]);
  }
  if (step.act === 'update' && step.asset.block) {
    const found = findBlock(current.bytes, step.asset.block.start, step.asset.block.end);
    if (found.kind !== 'one') throw new AccreteError('conflict', 'Managed block changed after planning');
    return Buffer.concat([current.bytes.subarray(0, found.start), step.incoming, current.bytes.subarray(found.end)]);
  }
  return step.act === 'update' ? step.incoming : scaffold.read(step.asset.source);
}

function writeCandidate(root, scaffold, step, entries, publish) {
  const { asset, destination } = step;
  const canonical = scaffold.unit(asset);
  const relative = candidatePath(scaffold, destination);
  refuseSymlinks(root, relative);
  const existing = readCurrent(root, relative);
  if (existing.kind !== 'file' || !existing.bytes.equals(canonical)) publish.write(relative, canonical);
  const previous = entries.get(destination);
  const kept = previous?.ownership === asset.ownership ? previous : null;
  entries.set(destination, {
    destination,
    profile: asset.profile,
    ownership: asset.ownership,
    installed_version: kept?.installed_version ?? null,
    base_sha256: kept?.base_sha256 ?? null,
    ...(asset.block ? { block: { start: asset.block.start, end: asset.block.end } } : {}),
    pending: {
      version: scaffold.template_version,
      incoming_sha256: sha256(canonical),
      candidate_path: relative,
      current_sha256: step.currentUnit
    }
  });
}

/** Carry out one decided step. An error affects only this path. */
function apply(root, scaffold, step, entries, publish) {
  const { destination, asset, act } = step;
  const current = readCurrent(root, destination);
  if (!KEEPS_FILES.has(act) && currentDigest(current) !== step.before) {
    throw new AccreteError('conflict', 'Destination changed after planning; run the upgrade again');
  }
  switch (act) {
    case 'install':
    case 'append-block':
    case 'update': {
      const digest = publish.base(step.incoming);
      publish.write(destination, newFileBytes(scaffold, step, current));
      entries.set(destination, installedEntry(scaffold, asset, digest));
      break;
    }
    case 'unchanged':
    case 'adopt':
    case 'keep-edited':
      entries.set(destination, installedEntry(scaffold, asset, publish.base(step.incoming)));
      break;
    case 'candidate':
      writeCandidate(root, scaffold, step, entries, publish);
      break;
    case 'keep-deleted': {
      const { pending: _, ...kept } = entries.get(destination);
      entries.set(destination, { ...kept, pending: null, locally_deleted: true });
      break;
    }
    case 'seed':
      publish.write(destination, step.incoming);
      entries.set(destination, { ...installedEntry(scaffold, asset, null) });
      break;
    case 'keep-seed':
      if (!entries.has(destination)) entries.set(destination, { ...installedEntry(scaffold, asset, null), installed_version: null });
      break;
    case 'remove':
      publish.remove(destination);
      entries.delete(destination);
      break;
    case 'remove-block': {
      const { block } = entries.get(destination);
      const found = current.kind === 'file' ? findBlock(current.bytes, block.start, block.end) : { kind: 'none' };
      if (found.kind !== 'one') throw new AccreteError('conflict', 'Managed block changed after planning');
      const rest = Buffer.concat([current.bytes.subarray(0, found.start), current.bytes.subarray(found.end)]);
      if (rest.toString('latin1').trim() === '') publish.remove(destination);
      else publish.write(destination, rest);
      entries.delete(destination);
      break;
    }
    case 'detach':
    case 'forget':
      entries.delete(destination);
      break;
    default:
      throw new Error(`Unknown step ${act}`);
  }
}

function writeInventory(root, inventory, publish) {
  const bytes = Buffer.from(`${JSON.stringify(inventory, null, 2)}\n`);
  const current = readCurrent(root, INVENTORY);
  if (current.kind !== 'file' || !current.bytes.equals(bytes)) publish.write(INVENTORY, bytes);
}

const inventoryOf = (scaffold, versions, selected, entries) => ({
  schema_version: 1,
  template_id: scaffold.template_id,
  template_version: versions.template_version,
  kernel_version: versions.kernel_version,
  selected_profiles: selected,
  files: [...entries.values()].sort((a, b) => a.destination < b.destination ? -1 : 1)
});

/** Remove bases and candidates no entry references. These names are ours. */
function sweep(root, inventory) {
  const keptBases = new Set(inventory.files.map(entry => entry.base_sha256));
  const bases = path.join(root, BASES);
  if (fs.existsSync(bases)) {
    for (const name of fs.readdirSync(bases)) {
      if (/^[0-9a-f]{64}$/.test(name) && !keptBases.has(name)) fs.rmSync(path.join(bases, name));
    }
  }
  const keptCandidates = new Set(inventory.files.map(entry => entry.pending?.candidate_path).filter(Boolean));
  const walk = relative => {
    for (const item of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const child = `${relative}/${item.name}`;
      if (item.isDirectory()) walk(child);
      else if (item.isFile() && item.name.endsWith('.incoming') && !keptCandidates.has(child)) fs.rmSync(path.join(root, child));
    }
    try {
      fs.rmdirSync(path.join(root, relative));
    } catch (error) {
      if (error.code !== 'ENOTEMPTY' && error.code !== 'EEXIST') throw error;
    }
  };
  if (fs.existsSync(path.join(root, UPGRADES))) walk(UPGRADES);
}

function report(step, scaffold) {
  const item = { destination: step.destination, action: step.act };
  if (step.act === 'candidate') {
    item.candidate = candidatePath(scaffold, step.destination);
    item.base_sha256 = step.base ?? null;
    item.next = `Resolve the candidate in the live file, then run: ${acceptCommand(scaffold, step.destination)}`;
  }
  return item;
}

const acceptCommand = (scaffold, destination) => `npx accrete-kit@${scaffold.template_version} upgrade --accept ${destination}`;
const failure = (destination, planned, error) => ({ destination, action: 'failed', planned, error: error.message });

/**
 * The one route by which a scaffold reaches a Workspace, for creation and upgrade.
 * `paths` are the Workspace's configured store roots, which assets must stay out of.
 */
export function reconcile(root, scaffold, { agents = null, dryRun = false, paths = {} } = {}) {
  for (const value of Object.values(paths)) {
    const store = path.posix.normalize(value).replace(/\/$/, '');
    const overlapping = scaffold.files.find(file => within(file.destination, store));
    if (overlapping) throw new AccreteError('invalid', `Scaffold destination overlaps a configured store: ${overlapping.destination}`);
  }
  for (const relative of [BASES, UPGRADES]) refuseSymlinks(root, relative);
  const existing = readInventory(root);
  const selected = agents ?? existing?.selected_profiles ?? scaffold.default_profiles;
  const entries = new Map((existing?.files ?? []).map(entry => [entry.destination, entry]));
  const assets = scaffold.files.filter(file => !file.profile || selected.includes(file.profile));
  const installed = new Set(assets.map(file => file.destination));

  const steps = [];
  const files = [];
  const plan = (destination, make) => {
    try {
      steps.push(make());
    } catch (error) {
      files.push(failure(destination, 'read', error));
    }
  };
  for (const asset of assets) plan(asset.destination, () => planAsset(root, scaffold, asset, entries.get(asset.destination)));
  for (const entry of entries.values()) {
    if (!installed.has(entry.destination)) plan(entry.destination, () => planWithdrawal(root, entry));
  }

  const listed = act => steps.filter(step => step.act === act).map(step => step.destination);
  const receipt = {
    ok: true,
    dry_run: dryRun,
    project_root: root,
    template_version: scaffold.template_version,
    kernel_version: scaffold.kernel_version,
    selected_profiles: selected,
    written: [],
    removed: [],
    pending: listed('candidate'),
    detached: listed('detach'),
    locally_deleted: listed('keep-deleted')
  };
  const finish = () => {
    receipt.files = files;
    receipt.failed = files.filter(item => item.action === 'failed');
    receipt.ok = receipt.failed.length === 0;
    if (receipt.pending.length > 0) {
      receipt.warning = `${receipt.pending.length} path(s) ${dryRun ? 'would be' : 'were'} preserved with a candidate under ${UPGRADES}; `
        + `resolve each in the live file, then run: npx accrete-kit@${scaffold.template_version} upgrade --accept PATH`;
    }
    return receipt;
  };
  if (dryRun) {
    files.push(...steps.map(step => report(step, scaffold)));
    return finish();
  }

  const publish = publisher(root);
  receipt.written = publish.written;
  receipt.removed = publish.removed;
  // A selection change is recorded before any file moves. Otherwise an agent's
  // half-removed files would read as owner deletions on a rerun without --agents.
  if (!existing || JSON.stringify(existing.selected_profiles) !== JSON.stringify(selected)) {
    writeInventory(root, inventoryOf(scaffold, existing ?? scaffold, selected, entries), publish);
  }
  for (const step of steps) {
    try {
      apply(root, scaffold, step, entries, publish);
      files.push(report(step, scaffold));
    } catch (error) {
      files.push(failure(step.destination, step.act, error));
    }
  }
  const inventory = inventoryOf(scaffold, scaffold, selected, entries);
  try {
    writeInventory(root, inventory, publish);
  } catch (error) {
    throw new AccreteError('incomplete', `Files were published, but the inventory could not be written: ${error.message}`, { inventory: path.join(root, INVENTORY) });
  }
  try {
    sweep(root, inventory);
  } catch (error) {
    receipt.cleanup_warning = error.message;
  }
  return finish();
}

/**
 * Record a resolved candidate: the current bytes stay, and the incoming unit
 * becomes the base they were resolved against.
 */
export function accept(root, scaffold, requested, { dryRun = false } = {}) {
  let relative = requested;
  if (path.isAbsolute(requested)) {
    let absolute = requested;
    try {
      absolute = fs.realpathSync(requested);
    } catch {
      // A missing path is reported below as not being a template path.
    }
    relative = path.relative(root, absolute);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new AccreteError('invalid', '--accept must name a path inside this Workspace');
  }
  const destination = path.normalize(relative).split(path.sep).join('/');
  const conflict = message => new AccreteError('conflict', message);
  const rerun = '; run npx accrete-kit@latest upgrade for a current candidate';
  const inventory = readInventory(root);
  if (!inventory) throw new AccreteError('not_found', 'This Workspace has no template inventory');
  const index = inventory.files.findIndex(entry => entry.destination === destination);
  if (index === -1) throw conflict(`${destination} is not a template path`);
  const { pending } = inventory.files[index];
  if (!pending) throw conflict(`${destination} has no pending candidate`);
  const asset = scaffold.files.find(file => file.destination === destination);
  if (!asset) throw conflict(`${destination} is not in this template version`);
  const incoming = scaffold.unit(asset);
  if (pending.version !== scaffold.template_version || pending.incoming_sha256 !== sha256(incoming)) {
    throw conflict(`The candidate for ${destination} belongs to version ${pending.version}, not this one${rerun}`);
  }
  refuseSymlinks(root, pending.candidate_path);
  const candidate = readCurrent(root, pending.candidate_path);
  if (candidate.kind !== 'file') throw conflict(`Candidate ${pending.candidate_path} is unreadable${rerun}`);
  if (sha256(candidate.bytes) !== pending.incoming_sha256) throw conflict(`Candidate ${pending.candidate_path} was changed${rerun}`);
  const current = readCurrent(root, destination);
  const unit = currentUnit(current, asset.block);
  if (unit.kind !== 'present') throw conflict(`${destination} has no usable managed content to accept; resolve it first`);
  const accepted = { destination, current_sha256: currentDigest(current), candidate: pending.candidate_path };
  const remaining = inventory.files.filter(entry => entry.pending && entry.destination !== destination).map(entry => entry.destination);
  const receipt = {
    ok: true,
    dry_run: dryRun,
    project_root: root,
    template_version: scaffold.template_version,
    kernel_version: scaffold.kernel_version,
    accepted,
    written: [],
    removed: [],
    pending: dryRun ? [destination, ...remaining] : remaining,
    failed: []
  };
  if (dryRun) return receipt;
  const publish = publisher(root);
  receipt.written = publish.written;
  const digest = publish.base(asset.block ? withNewlinesOf(incoming, unit.bytes) : incoming);
  inventory.files[index] = installedEntry(scaffold, asset, digest);
  writeInventory(root, inventory, publish);
  try {
    sweep(root, inventory);
  } catch (error) {
    receipt.cleanup_warning = error.message;
  }
  return receipt;
}
