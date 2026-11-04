// The accrete-ui this package carries, run in the foreground until it exits.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { AccreteError } from './fsutil.mjs';

const BUNDLED = new URL('../dist/ui/bin/accrete-ui.mjs', import.meta.url);

/** Before a Workspace is looked for: this host and this package can run the UI. */
export function checkUi() {
  if (process.platform !== 'darwin') throw new AccreteError('dependency', 'The UI is macOS only for now');
  if (!fs.existsSync(BUNDLED)) throw new AccreteError('dependency', 'This copy of accrete-kit has no UI in dist/ui; in a checkout, run scripts/fetch-ui.mjs');
}

export function runUi(root, values) {
  const args = [fileURLToPath(BUNDLED), '--project', root];
  if (values['no-open']) args.push('--no-open');
  if (values['no-tmux']) args.push('--no-tmux');
  if (values.port !== undefined) args.push('--port', values.port);
  const { status, signal, error } = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (error) throw new AccreteError('storage', `Cannot run the UI: ${error.message}`);
  return status ?? 128 + os.constants.signals[signal];
}
