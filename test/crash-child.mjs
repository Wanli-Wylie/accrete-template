// Runs one upgrade and dies at the Nth file publication or removal, as a kill would:
// no cleanup and no inventory. argv: root, scaffold directory, agents or -, N.
import fs from 'node:fs';
import { loadScaffold } from '../lib/scaffold.mjs';
import { upgradeWorkspace } from '../lib/workspace.mjs';

const [root, scaffoldDirectory, agents, count] = process.argv.slice(2);
let remaining = Number(count);
const tick = () => {
  remaining -= 1;
  if (remaining < 0) process.exit(9);
};
const scaffold = loadScaffold(scaffoldDirectory);
const { renameSync, rmSync } = fs;
fs.renameSync = (...args) => {
  tick();
  return renameSync(...args);
};
fs.rmSync = (target, ...rest) => {
  if (!String(target).endsWith('.accrete-tmp')) tick();
  return rmSync(target, ...rest);
};
upgradeWorkspace(root, { install: false, ...(agents === '-' ? {} : { agents }) }, scaffold);
