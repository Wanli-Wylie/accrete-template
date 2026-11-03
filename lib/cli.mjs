// Arguments and what the person or agent reads.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { AccreteError } from './fsutil.mjs';
import { BINARY } from './kernel.mjs';
import { MARKER, loadScaffold } from './scaffold.mjs';
import { createWorkspace, findWorkspace, installWorkspace, upgradeWorkspace } from './workspace.mjs';

const USAGE = `Create or upgrade an ACCRETE Workspace, and install its Kernel.

  npx accrete-kit@latest create DIRECTORY [OPTIONS]
  npx accrete-kit@latest create .                    Add to this directory or repository
  npx accrete-kit@latest upgrade [OPTIONS]
  npx accrete-kit@<version> install [OPTIONS]        Restore this host's Kernel after a clone

Create options:
  --name NAME  --id ID  --timezone IANA_ZONE
  --agents codex,claude|codex|claude|none
  --no-git  --no-install  --json

Upgrade options:
  --project PATH     Otherwise the nearest ancestor ${MARKER}
  --dry-run          Report the decisions and write nothing
  --agents codex,claude|codex|claude|none
  --accept PATH      Record a resolved candidate, relative to the Workspace
  --no-install  --json

Install options:
  --project PATH  --json

--no-install skips installing the Kernel binary. Owner edits are preserved: a conflict
leaves the file alone and writes a candidate under .accrete/template-upgrades/. The Kernel
runs as ${BINARY}; accrete-kit does not forward commands to it.`;

const OPTIONS = {
  name: { type: 'string' },
  id: { type: 'string' },
  timezone: { type: 'string' },
  agents: { type: 'string' },
  'no-git': { type: 'boolean' },
  'no-install': { type: 'boolean' },
  project: { type: 'string' },
  'dry-run': { type: 'boolean' },
  accept: { type: 'string' },
  json: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' }
};

function refuse(values, names, context) {
  for (const name of names) {
    if (values[name] !== undefined) throw new AccreteError('invalid', `--${name} does not apply ${context}`);
  }
}

function nextSteps(receipt, cwd) {
  const steps = [];
  const fresh = receipt.action === 'create' && !receipt.skipped;
  if (fresh) {
    const relative = path.relative(cwd, receipt.project_root);
    if (relative) steps.push(`cd ${relative.startsWith('..') ? receipt.project_root : relative}`);
  }
  if (receipt.kernel?.action === 'skipped' && !receipt.dry_run) steps.push(`npx accrete-kit@${receipt.template_version} install`);
  if (fresh) {
    if (receipt.ok) steps.push(`${BINARY} --version`);
    steps.push('Start your agent at the Workspace root; AGENTS.md is its entry point');
  }
  return steps;
}

function printHuman(receipt) {
  const out = line => process.stdout.write(`${line}\n`);
  const where = receipt.project_root;
  if (receipt.skipped) out(receipt.message);
  else if (receipt.action === 'accept') out(`${receipt.dry_run ? 'Would accept' : 'Accepted'} ${receipt.accepted.destination} in ${where}`);
  else if (receipt.action === 'install') out(`Kernel for ${receipt.kernel.platform} in ${where}`);
  else if (receipt.dry_run) out(`Would apply template ${receipt.template_version} to ${where}`);
  else {
    const verb = receipt.action === 'upgrade' ? 'Upgraded' : receipt.created ? 'Created' : 'Updated';
    out(`${verb} ACCRETE Workspace ${where} (template ${receipt.template_version})`);
  }
  if (receipt.git_initialized) out('Initialized a Git repository; nothing is committed.');
  if (receipt.kernel) out(`Kernel: accrete ${receipt.kernel.version} at ${receipt.kernel.path} (${receipt.kernel.action})`);
  if (receipt.files) {
    const counts = new Map();
    for (const { action } of receipt.files) counts.set(action, (counts.get(action) ?? 0) + 1);
    if (counts.size > 0) out(`  ${[...counts].map(([action, count]) => `${action}: ${count}`).join(', ')}`);
    for (const { destination, candidate, next } of receipt.files) {
      if (candidate) out(`  pending ${destination}\n    candidate ${candidate}\n    ${next}`);
    }
  }
  for (const destination of receipt.detached ?? []) out(`  detached ${destination} (edited; no longer managed)`);
  for (const destination of receipt.locally_deleted ?? []) out(`  kept deleted ${destination}`);
  for (const { destination, error, retry } of receipt.failed) {
    out(`  failed ${destination}: ${error}`);
    if (retry) out(`    retry: ${retry}`);
  }
  if (receipt.next_steps.length > 0) {
    out('\nNext steps:');
    for (const step of receipt.next_steps) out(`  ${step}`);
  }
}

function selectWorkspace(values, directories, cwd, command) {
  if (directories.length > 0) throw new AccreteError('invalid', `${command} takes no directory; use --project ${directories[0]}`);
  const named = values.project === undefined ? null : path.resolve(cwd, values.project);
  const root = named === null ? findWorkspace(cwd) : fs.existsSync(named) ? fs.realpathSync(named) : null;
  if (!root || !fs.existsSync(path.join(root, MARKER))) {
    throw new AccreteError('not_found', `No ACCRETE Workspace (${MARKER}) at ${values.project ?? `or above ${cwd}`}; create one with npx accrete-kit@latest create`);
  }
  return root;
}

function install(values, directories, scaffold, cwd) {
  refuse(values, ['name', 'id', 'timezone', 'no-git', 'no-install', 'dry-run', 'agents', 'accept'], 'to install');
  return installWorkspace(selectWorkspace(values, directories, cwd, 'install'), scaffold);
}

function upgrade(values, directories, scaffold, cwd) {
  refuse(values, ['name', 'id', 'timezone', 'no-git'], 'to upgrade');
  if (values.accept !== undefined && values.agents !== undefined) throw new AccreteError('invalid', '--accept and --agents are separate operations');
  const root = selectWorkspace(values, directories, cwd, 'upgrade');
  return upgradeWorkspace(root, {
    agents: values.agents,
    accept: values.accept,
    dryRun: values['dry-run'],
    install: !values['no-install']
  }, scaffold);
}

function create(values, directories, scaffold, cwd) {
  refuse(values, ['project', 'dry-run', 'accept'], 'to create');
  if (directories.length !== 1) throw new AccreteError('invalid', 'create takes one directory, or . for this one');
  return createWorkspace(path.resolve(cwd, directories[0]), {
    name: values.name,
    id: values.id,
    timezone: values.timezone,
    agents: values.agents,
    git: !values['no-git'],
    install: !values['no-install']
  }, scaffold);
}

const COMMANDS = { create, upgrade, install };

export function main(argv, cwd = process.cwd()) {
  const jsonRequested = argv.includes('--json');
  try {
    let parsed;
    try {
      parsed = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true });
    } catch (error) {
      throw new AccreteError('invalid', error.message);
    }
    const { values, positionals } = parsed;
    if (values.help) {
      process.stdout.write(`${USAGE}\n`);
      return 0;
    }
    const scaffold = loadScaffold();
    if (values.version) {
      process.stdout.write(`accrete-kit ${scaffold.template_version} (carries Kernel ${scaffold.kernel_version})\n`);
      return 0;
    }
    const [command, ...directories] = positionals;
    if (!Object.hasOwn(COMMANDS, command ?? '')) {
      throw new AccreteError('invalid', command === undefined ? 'Name a subcommand: create, upgrade or install' : `Unknown subcommand ${command}; use create, upgrade or install`);
    }
    const receipt = COMMANDS[command](values, directories, scaffold, cwd);
    receipt.next_steps = nextSteps(receipt, cwd);
    if (receipt.warning) process.stderr.write(`warning: ${receipt.warning}\n`);
    for (const warning of receipt.warnings ?? []) process.stderr.write(`warning: ${warning}\n`);
    if (receipt.cleanup_warning) process.stderr.write(`warning: cleanup: ${receipt.cleanup_warning}\n`);
    if (values.json) process.stdout.write(`${JSON.stringify(receipt)}\n`);
    else printHuman(receipt);
    return receipt.ok ? 0 : 7;
  } catch (caught) {
    const error = caught instanceof AccreteError ? caught : new AccreteError('storage', caught.message);
    if (jsonRequested) process.stderr.write(`${JSON.stringify(error)}\n`);
    else {
      process.stderr.write(`${error.kind}: ${error.message}\n`);
      if (error.message.includes('subcommand')) process.stderr.write(`\n${USAGE}\n`);
      if (error.details) process.stderr.write(`${JSON.stringify(error.details, null, 2)}\n`);
    }
    return error.exitCode;
  }
}
