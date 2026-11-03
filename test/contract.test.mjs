// The drift guard, against a stand-in binary whose --help is what the test says it is.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { tempDir } from './support.mjs';

const SCRIPT = fileURLToPath(new URL('../scripts/check-cli-contract.mjs', import.meta.url));
const catalog = JSON.parse(fs.readFileSync(new URL('../contract/cli-v1.json', import.meta.url), 'utf8'));

/** Prints --help as the catalog would have it, minus one flag or one command. */
function standIn(t, { withoutFlag = null, withoutCommand = null } = {}) {
  const directory = tempDir(t);
  const help = Object.fromEntries(catalog.commands.filter(entry => entry.command !== withoutCommand).map(entry => [entry.command, '']));
  for (const { command, usage } of catalog.commands) {
    if (command in help) help[command] += `${usage}\n`;
  }
  const binary = path.join(directory, 'accrete');
  fs.writeFileSync(binary, `#!${process.execPath}
const help = ${JSON.stringify(help)};
const words = process.argv.slice(2, -1).join(' ');
const text = words === '' ? ${JSON.stringify(catalog.globals.join('\n'))} : help[words];
if (text === undefined) { console.error('unrecognized'); process.exit(2); }
console.log(text.replaceAll(${JSON.stringify(withoutFlag ?? '\0')}, '--renamed'));
`, { mode: 0o755 });
  return binary;
}

const check = binary => spawnSync(process.execPath, [SCRIPT, '--binary', binary], { encoding: 'utf8' });

test('a binary matching the catalog passes', t => {
  const result = check(standIn(t));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`^${catalog.commands.length} catalog entries`));
});

test('a missing flag or command is drift', t => {
  const flag = check(standIn(t, { withoutFlag: '--expect' }));
  assert.equal(flag.status, 1);
  assert.match(flag.stderr, /names --expect, absent from --help/);
  const command = check(standIn(t, { withoutCommand: 'memory append' }));
  assert.equal(command.status, 1);
  assert.match(command.stderr, /memory append: no such command/);
});
