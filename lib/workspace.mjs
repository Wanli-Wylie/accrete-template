// A Workspace on disk: its marker, where it is found, and how one is created.
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { AccreteError, atomicWrite, refuseSymlinks } from './fsutil.mjs';
import { accept, publisher, readInventory, reconcile } from './install.mjs';
import { BINARY, compareVersions, hostPlatform, installKernel, numericVersion } from './kernel.mjs';
import { MARKER, parseAgents } from './scaffold.mjs';

/** The scalar keys of a TOML document by table. The rest of it is not our concern. */
function readSimpleToml(text) {
  const tables = { '': {} };
  let table = tables[''];
  for (const line of text.split(/\r?\n/)) {
    const header = line.match(/^\s*\[([^\[\]]+)\]\s*(?:#.*)?$/);
    if (header) {
      table = tables[header[1].trim()] ??= {};
      continue;
    }
    const pair = line.match(/^\s*([A-Za-z0-9_-]+)\s*=\s*("(?:[^"\\]|\\.)*"|'[^']*'|[+-]?\d+)\s*(?:#.*)?$/);
    if (!pair) continue;
    const value = pair[2];
    if (value.startsWith('"')) {
      try {
        table[pair[1]] = JSON.parse(value);
      } catch {
        table[pair[1]] = value.slice(1, -1);
      }
    } else {
      table[pair[1]] = value.startsWith("'") ? value.slice(1, -1) : Number(value);
    }
  }
  return tables;
}

export function readMarker(root) {
  refuseSymlinks(root, MARKER);
  const tables = readSimpleToml(fs.readFileSync(path.join(root, MARKER), 'utf8'));
  const { format, project_id: projectId, name, timezone } = tables[''];
  if (!Number.isInteger(format) || typeof projectId !== 'string') {
    throw new AccreteError('config', `${path.join(root, MARKER)} lacks format or project_id`);
  }
  return { format, project_id: projectId, name, timezone, paths: tables.paths ?? {} };
}

function checkFormat(scaffold, format) {
  const { min, max } = scaffold.project_formats;
  if (format < min || format > max) {
    throw new AccreteError('unsupported_format', `This template supports project format ${min === max ? min : `${min} to ${max}`}, not ${format}`);
  }
}

/** The defaults' text with the identity inserted after its `format` line. */
export function markerText(scaffold, { projectId, name, timezone }) {
  const tomlString = value => JSON.stringify(value).replaceAll('\u007f', '\\u007f');
  const identity = [`project_id = ${tomlString(projectId)}`, `name = ${tomlString(name)}`];
  const lines = [];
  for (const line of scaffold.defaults.split('\n')) {
    if (/^\s*#/.test(line)) continue;
    if (/^timezone\s*=/.test(line)) continue;
    lines.push(line);
    if (/^format\s*=/.test(line)) lines.push(...identity, `timezone = ${tomlString(timezone)}`);
  }
  return `${lines.join('\n').trim()}\n`;
}

function checkId(id) {
  if (!/^[A-Za-z0-9._-]{1,180}$/.test(id) || id === '.' || id === '..') {
    throw new AccreteError('invalid', "IDs must be 1-180 ASCII letters, digits, '.', '_' or '-' and cannot be '.' or '..'");
  }
}

function checkTimezone(zone) {
  let resolved = null;
  if (/^[A-Za-z]/.test(zone)) {
    try {
      resolved = new Intl.DateTimeFormat('en-US', { timeZone: zone }).resolvedOptions().timeZone;
    } catch {
      resolved = null;
    }
  }
  // ICU folds case; the Kernel reads the exact IANA spelling.
  if (!resolved || (resolved !== zone && resolved.toLowerCase() === zone.toLowerCase())) {
    throw new AccreteError('invalid', `Unknown IANA timezone ${zone}`);
  }
}

/** The real path of the deepest existing ancestor, plus the rest. */
function canonicalFuture(target) {
  const absolute = path.resolve(target);
  const rest = [];
  let current = absolute;
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) break;
    rest.unshift(path.basename(current));
    current = parent;
  }
  return path.join(fs.realpathSync(current), ...rest);
}

const git = (...args) => spawnSync('git', args, { encoding: 'utf8' });

function initializeGit(root) {
  if (git('-C', root, 'rev-parse', '--git-dir').status === 0) return false;
  const result = git('-C', root, 'init');
  if (result.status !== 0) {
    throw new AccreteError('external', 'Workspace files are in place, but git init failed', { project_root: root, stderr: result.stderr });
  }
  return true;
}

const shellWord = word => /^[\w./-]+$/.test(word) ? word : `'${word.replaceAll("'", `'\\''`)}'`;

/** Install this host's Kernel. A failure leaves the Workspace and names the retry. */
function configureKernel(root, scaffold, receipt, { install = true, dryRun = false }) {
  const report = action => ({ version: scaffold.kernel_version, platform: hostPlatform(), path: BINARY, action });
  if (!install) {
    receipt.kernel = report('skipped');
    return;
  }
  try {
    const publish = publisher(root);
    receipt.kernel = installKernel(root, scaffold, { dryRun, write: publish.write.bind(publish) });
    receipt.written.push(...publish.written);
  } catch (error) {
    receipt.kernel = report('failed');
    receipt.ok = false;
    receipt.failed.push({
      destination: BINARY,
      action: 'failed',
      planned: 'install',
      error: error.message,
      retry: `npx accrete-kit@${scaffold.template_version} install --project ${shellWord(root)}`
    });
  }
}

export function createWorkspace(target, options, scaffold) {
  const agents = options.agents === undefined ? null : parseAgents(scaffold, options.agents);
  if (options.id !== undefined) checkId(options.id);
  if (options.timezone !== undefined) checkTimezone(options.timezone);
  if (options.name === '') throw new AccreteError('invalid', '--name cannot be empty');
  const root = canonicalFuture(target);
  if (options.git !== false && git('--version').status !== 0) {
    throw new AccreteError('dependency', 'Git is needed to initialize a repository; use --no-git to omit it');
  }
  if (fs.existsSync(root) && !fs.statSync(root).isDirectory()) throw new AccreteError('invalid', `${root} is not a directory`);
  refuseSymlinks(root, MARKER);

  const created = !fs.existsSync(path.join(root, MARKER));
  let identity;
  if (created) {
    const defaults = readSimpleToml(scaffold.defaults)[''];
    checkFormat(scaffold, defaults.format);
    identity = {
      format: defaults.format,
      project_id: options.id ?? randomUUID(),
      name: options.name ?? path.basename(root),
      timezone: options.timezone ?? defaults.timezone,
      paths: readSimpleToml(scaffold.defaults).paths ?? {}
    };
  } else {
    identity = readMarker(root);
    checkFormat(scaffold, identity.format);
    if (options.id !== undefined && options.id !== identity.project_id) {
      throw new AccreteError('conflict', 'The existing Workspace identity differs from the requested ID', { path: path.join(root, MARKER), project_id: identity.project_id });
    }
    if (options.name !== undefined && options.name !== identity.name) {
      throw new AccreteError('conflict', 'The existing Workspace name differs; creation does not rewrite shared configuration', { path: path.join(root, MARKER), name: identity.name });
    }
  }
  const header = {
    action: 'create',
    created,
    project_id: identity.project_id,
    name: identity.name,
    timezone: identity.timezone,
    format: identity.format,
    marker: path.join(root, MARKER)
  };

  // A repeated creation finishes its own version; moving to another is upgrade.
  const installed = created ? null : readInventory(root);
  if (installed && installed.template_version !== scaffold.template_version) {
    return {
      ok: true,
      ...header,
      skipped: true,
      project_root: root,
      template_version: scaffold.template_version,
      kernel_version: scaffold.kernel_version,
      installed_version: installed.template_version,
      git_initialized: false,
      written: [],
      removed: [],
      pending: [],
      failed: [],
      message: `This Workspace has template ${installed.template_version}; use npx accrete-kit@${scaffold.template_version} upgrade`
    };
  }

  if (created) {
    atomicWrite(path.join(root, MARKER), Buffer.from(markerText(scaffold, {
      projectId: identity.project_id, name: identity.name, timezone: identity.timezone
    })));
  }
  const receipt = reconcile(root, scaffold, { agents, paths: identity.paths });
  if (created) receipt.written.unshift(MARKER);
  const gitInitialized = options.git === false ? false : initializeGit(root);
  if (!created && options.timezone !== undefined && options.timezone !== identity.timezone) {
    receipt.warnings = [`The existing timezone ${identity.timezone} was kept; edit ${MARKER} to change it`];
  }
  configureKernel(root, scaffold, receipt, options);
  return { ...receipt, ...header, git_initialized: gitInitialized };
}

export function findWorkspace(start) {
  let current = fs.realpathSync(start);
  for (;;) {
    if (fs.existsSync(path.join(current, MARKER))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/** An older package would rewrite newer guidance backward. Equal versions run. */
function refuseBackward(inventory, scaffold) {
  const installed = numericVersion(inventory?.template_version ?? '');
  const incoming = numericVersion(scaffold.template_version);
  if (installed && incoming && compareVersions(installed, incoming) > 0) {
    throw new AccreteError('conflict', `This Workspace has template ${inventory.template_version}, newer than accrete-kit ${scaffold.template_version}; use npx accrete-kit@latest upgrade`);
  }
}

export function upgradeWorkspace(root, options, scaffold) {
  const identity = readMarker(root);
  checkFormat(scaffold, identity.format);
  refuseBackward(readInventory(root), scaffold);
  const dryRun = Boolean(options.dryRun);
  if (options.accept !== undefined) {
    return { action: 'accept', project_id: identity.project_id, ...accept(root, scaffold, options.accept, { dryRun }) };
  }
  const agents = options.agents === undefined ? null : parseAgents(scaffold, options.agents);
  const receipt = reconcile(root, scaffold, { agents, dryRun, paths: identity.paths });
  configureKernel(root, scaffold, receipt, { ...options, dryRun });
  return { action: 'upgrade', project_id: identity.project_id, ...receipt };
}

/** Restore this host's Kernel in an existing Workspace, at the version it records. */
export function installWorkspace(root, scaffold) {
  const identity = readMarker(root);
  checkFormat(scaffold, identity.format);
  const inventory = readInventory(root);
  if (!inventory) throw new AccreteError('not_found', 'This Workspace has no template inventory; run npx accrete-kit@latest upgrade');
  if (inventory.kernel_version !== scaffold.kernel_version) {
    const command = `npx accrete-kit@${inventory.template_version} install`;
    throw new AccreteError('conflict', `This Workspace records Kernel ${inventory.kernel_version}, and accrete-kit ${scaffold.template_version} carries ${scaffold.kernel_version}; run ${command}`, { command });
  }
  const publish = publisher(root);
  const kernel = installKernel(root, scaffold, { write: publish.write.bind(publish) });
  return {
    ok: true,
    action: 'install',
    dry_run: false,
    project_root: root,
    project_id: identity.project_id,
    template_version: inventory.template_version,
    kernel_version: scaffold.kernel_version,
    kernel,
    written: publish.written,
    removed: [],
    pending: inventory.files.filter(entry => entry.pending).map(entry => entry.destination),
    failed: []
  };
}
