// Errors and the file operations every other module goes through.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// The same kinds and exit codes as the accrete Kernel.
const EXIT_CODES = {
  invalid: 2, unsupported_format: 2, config: 3, not_found: 3, conflict: 4,
  dependency: 5, storage: 6, external: 7, incomplete: 7
};

export class AccreteError extends Error {
  constructor(kind, message, details = null) {
    super(message);
    this.kind = kind;
    this.details = details;
    this.exitCode = EXIT_CODES[kind] ?? 6;
  }
  toJSON() {
    return {
      ok: false,
      error: { kind: this.kind, message: this.message, details: this.details },
      exit_code: this.exitCode
    };
  }
}

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

/** A forward-slash relative path with normal components only. */
export function checkRelative(text) {
  const portable = typeof text === 'string' && text.length > 0
    && !/[\\:\u0000-\u001f]/.test(text)
    && !text.startsWith('/')
    && !text.split('/').some(part => part === '' || part === '.' || part === '..');
  if (!portable) throw new AccreteError('invalid', `Paths must be portable relative paths without traversal: ${text}`);
  return text;
}

const lstat = target => {
  try {
    return fs.lstatSync(target);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
    throw error;
  }
};

export function refuseSymlinks(root, relative) {
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if (lstat(current)?.isSymbolicLink()) {
      throw new AccreteError('conflict', `Path traverses a symbolic link: ${current}`);
    }
  }
}

/**
 * What is at a destination, without following links: `missing`, a regular
 * `file` with its bytes, or `other` for a directory, symbolic link or special
 * file at or above it.
 */
export function readCurrent(root, destination) {
  const parts = checkRelative(destination).split('/');
  let current = root;
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    const stat = lstat(current);
    if (!stat) return { kind: 'missing' };
    if (index === parts.length - 1) {
      return stat.isFile() ? { kind: 'file', bytes: fs.readFileSync(current) } : { kind: 'other' };
    }
    if (!stat.isDirectory()) return { kind: 'other' };
  }
  return { kind: 'other' };
}

function syncDirectory(directory) {
  let fd;
  try {
    fd = fs.openSync(directory, 'r');
    fs.fsyncSync(fd);
  } catch (error) {
    // Some platforms cannot open or synchronize a directory.
    if (!['EISDIR', 'EPERM', 'EINVAL', 'ENOTSUP'].includes(error.code)) throw error;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

/**
 * Temp sibling, fsync, rename, fsync the directory. The temp name is fixed, so
 * the next write of this path replaces one a killed run left behind.
 */
export function atomicWrite(target, bytes, { mode: requested } = {}) {
  const directory = path.dirname(target);
  const firstCreated = fs.mkdirSync(directory, { recursive: true });
  const temporary = path.join(directory, `.${path.basename(target)}.accrete-tmp`);
  const mode = requested ?? lstat(target)?.mode;
  fs.rmSync(temporary, { force: true });
  try {
    const fd = fs.openSync(temporary, 'wx', 0o644);
    try {
      fs.writeFileSync(fd, bytes);
      if (mode !== undefined) fs.fchmodSync(fd, mode & 0o7777);
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(temporary, target);
  } catch (error) {
    fs.rmSync(temporary, { force: true });
    throw error;
  }
  syncDirectory(directory);
  if (firstCreated) {
    for (let up = directory; up !== path.dirname(firstCreated); up = path.dirname(up)) syncDirectory(path.dirname(up));
  }
}

export function removeWithEmptyParents(root, destination) {
  const target = path.join(root, destination);
  fs.rmSync(target);
  let directory = path.dirname(target);
  while (directory !== root) {
    try {
      fs.rmdirSync(directory);
    } catch {
      break;
    }
    directory = path.dirname(directory);
  }
  syncDirectory(directory);
}
