#!/usr/bin/env node
// Place the declared Kernel's release binaries in the package, under dist/kernel/, each
// verified against the release's SHA256SUMS. accrete.cli and accrete.cliRepo in
// package.json name the version and where it is released.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { PLATFORMS } from '../lib/kernel.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = message => {
  throw new Error(message);
};

const { values } = parseArgs({
  options: {
    from: { type: 'string' },
    'allow-partial': { type: 'boolean' },
    check: { type: 'boolean' },
    help: { type: 'boolean' }
  }
});
if (values.help) {
  console.log(`node scripts/fetch-kernel.mjs [--from DIR] [--allow-partial] [--check]

Downloads the declared release from GitHub, or reads archives and SHA256SUMS from DIR.
--allow-partial accepts fewer than all four platforms, for local development only.
--check changes nothing and fails unless all four are in place at the declared version.`);
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const { cli: version, cliRepo } = pkg.accrete;
const kernelRoot = path.join(root, 'dist/kernel');
const indexPath = path.join(kernelRoot, 'kernel.json');

function check() {
  let index;
  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch {
    fail(`no ${path.relative(root, indexPath)}; run scripts/fetch-kernel.mjs`);
  }
  if (index.version !== version) fail(`dist/kernel holds ${index.version}; package.json declares ${version}`);
  for (const platform of Object.keys(PLATFORMS)) {
    const entry = index.platforms[platform];
    if (!entry) fail(`no Kernel for ${platform}`);
    for (const file of ['accrete', 'LICENSE', 'THIRD-PARTY-NOTICES']) {
      if (!fs.existsSync(path.join(kernelRoot, platform, file))) fail(`${platform} lacks ${file}`);
    }
    if (sha256(fs.readFileSync(path.join(kernelRoot, platform, 'accrete'))) !== entry.sha256) fail(`${platform} does not match its digest`);
  }
  console.log(`dist/kernel holds Kernel ${version} for all ${Object.keys(PLATFORMS).length} platforms`);
}

const releaseUrl = `https://github.com/${cliRepo}/releases/download/v${version}`;

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

function unpack(bytes, archive, platform, work) {
  const directory = path.join(work, platform);
  fs.mkdirSync(directory);
  const archivePath = path.join(work, archive);
  fs.writeFileSync(archivePath, bytes);
  const tar = spawnSync('tar', ['-xzf', archivePath, '-C', directory], { encoding: 'utf8' });
  if (tar.status !== 0) fail(`cannot extract ${archive}: ${tar.stderr ?? tar.error?.message}`);
  const top = path.join(directory, archive.replace(/\.tar\.gz$/, ''));
  for (const required of ['accrete', 'LICENSE', 'THIRD-PARTY-NOTICES']) {
    if (!fs.existsSync(path.join(top, required)) || !fs.lstatSync(path.join(top, required)).isFile()) fail(`${archive} lacks ${required}`);
  }
  return top;
}

async function fetchAll() {
  const sums = await readRelease('SHA256SUMS');
  if (!sums) fail(`no SHA256SUMS in ${values.from ?? releaseUrl}`);
  const expected = new Map(sums.toString('utf8').split('\n').filter(Boolean).map(line => {
    const [digest, ...name] = line.trim().split(/\s+/);
    return [name.join(' ').replace(/^\*/, ''), digest];
  }));
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'accrete-kernel-'));
  const index = { version, platforms: {} };
  const unpacked = new Map();
  try {
    for (const [platform, target] of Object.entries(PLATFORMS)) {
      const archive = `accrete-${version}-${target}.tar.gz`;
      const bytes = await readRelease(archive);
      if (!bytes) {
        if (values['allow-partial']) continue;
        fail(`no ${archive} in ${values.from ?? releaseUrl}; --allow-partial is for local development only`);
      }
      if (!expected.has(archive)) fail(`SHA256SUMS does not list ${archive}`);
      if (sha256(bytes) !== expected.get(archive)) fail(`${archive} does not match SHA256SUMS`);
      unpacked.set(platform, unpack(bytes, archive, platform, work));
    }
    if (unpacked.size === 0) fail(`no archives for ${version} in ${values.from ?? releaseUrl}`);
    // Staged beside dist/kernel, so a bad archive leaves what was there.
    const staging = `${kernelRoot}.staging`;
    fs.rmSync(staging, { recursive: true, force: true });
    for (const [platform, top] of unpacked) {
      const destination = path.join(staging, platform);
      fs.mkdirSync(destination, { recursive: true });
      for (const name of ['accrete', 'LICENSE', 'THIRD-PARTY-NOTICES', 'licenses']) {
        if (fs.existsSync(path.join(top, name))) copyTree(path.join(top, name), path.join(destination, name));
      }
      fs.chmodSync(path.join(destination, 'accrete'), 0o755);
      index.platforms[platform] = { sha256: sha256(fs.readFileSync(path.join(destination, 'accrete'))) };
    }
    fs.writeFileSync(path.join(staging, 'kernel.json'), `${JSON.stringify(index, null, 2)}\n`);
    fs.rmSync(kernelRoot, { recursive: true, force: true });
    fs.renameSync(staging, kernelRoot);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
  console.log(`dist/kernel holds Kernel ${version} for ${Object.keys(index.platforms).join(', ')}`);
}

try {
  if (values.check) check();
  else await fetchAll();
} catch (error) {
  console.error(`fetch-kernel: ${error.message}`);
  process.exitCode = 1;
}
