#!/usr/bin/env node
// Place the declared accrete-ui release in the package, under dist/ui/, verified against the
// release's SHA256SUMS. accrete.ui and accrete.uiRepo in package.json name the version and
// where it is released. It is one archive: the UI runs on macOS, with both prebuilds in it.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = message => {
  throw new Error(message);
};

const { values } = parseArgs({
  options: {
    from: { type: 'string' },
    check: { type: 'boolean' },
    help: { type: 'boolean' }
  }
});
if (values.help) {
  console.log(`node scripts/fetch-ui.mjs [--from DIR] [--check]

Downloads the declared release from GitHub, or reads the archive and SHA256SUMS from DIR.
--check changes nothing and fails unless the UI is in place at the declared version.`);
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const { ui: version, uiRepo } = pkg.accrete;
const uiRoot = path.join(root, 'dist/ui');
const indexPath = path.join(uiRoot, 'ui.json');
const HELPERS = ['darwin-arm64', 'darwin-x64'].map(platform => `vendor/node-pty/prebuilds/${platform}/spawn-helper`);
const REQUIRED = ['bin/accrete-ui.mjs', 'server/server.mjs', 'page/index.html', 'LICENSE', 'THIRD-PARTY-NOTICES', ...HELPERS];

function check() {
  let index;
  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch {
    fail(`no ${path.relative(root, indexPath)}; run scripts/fetch-ui.mjs`);
  }
  if (index.version !== version) fail(`dist/ui holds ${index.version}; package.json declares ${version}`);
  for (const file of REQUIRED) {
    if (!fs.existsSync(path.join(uiRoot, file))) fail(`dist/ui lacks ${file}`);
  }
  for (const helper of HELPERS) {
    if ((fs.statSync(path.join(uiRoot, helper)).mode & 0o111) !== 0o111) fail(`${helper} is not executable`);
  }
  console.log(`dist/ui holds accrete-ui ${version}`);
}

const releaseUrl = `https://github.com/${uiRepo}/releases/download/v${version}`;

/** A named release file as bytes, or null if the release does not have it. */
async function readRelease(name) {
  if (values.from) {
    const local = path.join(values.from, name);
    return fs.existsSync(local) ? fs.readFileSync(local) : null;
  }
  const response = await fetch(`${releaseUrl}/${name}`);
  if (response.status === 404) return null;
  if (!response.ok) fail(`${releaseUrl}/${name}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

/** Copy real files only: nothing in an archive can make a link into the package. */
function copyTree(source, destination) {
  const stat = fs.lstatSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const name of fs.readdirSync(source)) copyTree(path.join(source, name), path.join(destination, name));
  } else if (stat.isFile()) {
    fs.copyFileSync(source, destination);
  } else {
    fail(`archive holds something other than files and directories: ${source}`);
  }
}

function unpack(bytes, archive, work) {
  const archivePath = path.join(work, archive);
  fs.writeFileSync(archivePath, bytes);
  const tar = spawnSync('tar', ['-xzf', archivePath, '-C', work], { encoding: 'utf8' });
  if (tar.status !== 0) fail(`cannot extract ${archive}: ${tar.stderr ?? tar.error?.message}`);
  const top = path.join(work, archive.replace(/\.tar\.gz$/, ''));
  for (const required of REQUIRED) {
    if (!fs.existsSync(path.join(top, required)) || !fs.lstatSync(path.join(top, required)).isFile()) fail(`${archive} lacks ${required}`);
  }
  return top;
}

async function fetchUi() {
  const sums = await readRelease('SHA256SUMS');
  if (!sums) fail(`no SHA256SUMS in ${values.from ?? releaseUrl}`);
  const expected = new Map(sums.toString('utf8').split('\n').filter(Boolean).map(line => {
    const [digest, ...name] = line.trim().split(/\s+/);
    return [name.join(' ').replace(/^\*/, ''), digest];
  }));
  const archive = `accrete-ui-${version}.tar.gz`;
  const bytes = await readRelease(archive);
  if (!bytes) fail(`no ${archive} in ${values.from ?? releaseUrl}`);
  if (!expected.has(archive)) fail(`SHA256SUMS does not list ${archive}`);
  if (sha256(bytes) !== expected.get(archive)) fail(`${archive} does not match SHA256SUMS`);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'accrete-ui-'));
  try {
    const top = unpack(bytes, archive, work);
    // Staged beside dist/ui, so a bad archive leaves what was there.
    const staging = `${uiRoot}.staging`;
    fs.rmSync(staging, { recursive: true, force: true });
    fs.mkdirSync(staging, { recursive: true });
    for (const name of ['bin', 'server', 'page', 'vendor', 'LICENSE', 'THIRD-PARTY-NOTICES']) {
      copyTree(path.join(top, name), path.join(staging, name));
    }
    for (const helper of HELPERS) fs.chmodSync(path.join(staging, helper), 0o755);
    fs.writeFileSync(path.join(staging, 'ui.json'), `${JSON.stringify({ version }, null, 2)}\n`);
    fs.rmSync(uiRoot, { recursive: true, force: true });
    fs.renameSync(staging, uiRoot);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
  console.log(`dist/ui holds accrete-ui ${version}`);
}

try {
  if (values.check) check();
  else await fetchUi();
} catch (error) {
  console.error(`fetch-ui: ${error.message}`);
  process.exitCode = 1;
}
