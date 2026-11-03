#!/usr/bin/env node
// The drift guard between this repository's command catalog and a built Kernel:
// every catalog entry and long flag must appear in that binary's --help. A
// maintainer and release check, since the binary comes from accrete-cli.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

/** Long flags in a usage line, such as `--agents` in `[--agents codex|claude]`. */
function longFlags(usage) {
  return usage.split(/\s+/)
    .map(token => token.replace(/^\[+/, ''))
    .filter(token => token.startsWith('--'))
    .map(token => `--${token.replace(/^-+/, '').match(/^[A-Za-z0-9-]*/)[0]}`);
}

/** Whether `--flag` appears as a whole option in help text, not as a prefix of another. */
const mentions = (help, flag) => help.split(/[^A-Za-z0-9-]+/).includes(flag);

function help(binary, words) {
  const result = spawnSync(binary, [...words, '--help'], { encoding: 'utf8' });
  if (result.error) throw result.error;
  return result.status === 0 ? { text: result.stdout } : { error: result.stderr.trim() };
}

const { values } = parseArgs({ options: { binary: { type: 'string' } } });
if (!values.binary) {
  console.error('Usage: node scripts/check-cli-contract.mjs --binary PATH');
  process.exit(2);
}
const catalog = JSON.parse(readFileSync(new URL('../contract/cli-v1.json', import.meta.url), 'utf8'));
const drift = [];
const root = help(values.binary, []);
for (const global of catalog.globals) {
  const flag = longFlags(global)[0];
  if (root.error || !mentions(root.text, flag)) drift.push(`global ${flag} is absent from --help`);
}
let flags = 0;
for (const { command, usage } of catalog.commands) {
  const result = help(values.binary, command.split(/\s+/));
  if (result.error !== undefined) {
    drift.push(`${command}: no such command: ${result.error}`);
    continue;
  }
  for (const flag of longFlags(usage)) {
    flags += 1;
    if (!mentions(result.text, flag)) drift.push(`${command}: \`${usage}\` names ${flag}, absent from --help`);
  }
}
if (drift.length > 0) {
  console.error(`Catalog and CLI differ:\n${drift.join('\n')}`);
  process.exit(1);
}
console.log(`${catalog.commands.length} catalog entries and ${flags} long flags match ${values.binary}`);
