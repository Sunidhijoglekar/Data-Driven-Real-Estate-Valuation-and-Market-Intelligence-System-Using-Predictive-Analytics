import fs from 'node:fs';
import path from 'node:path';

export const dataDir = path.resolve(process.env.DATA_DIR || 'database/runtime');
fs.mkdirSync(dataDir, { recursive: true });

// JSON storage is supported by exactly one server process per data directory.
const lock = path.join(dataDir, 'server.lock');
try {
  const pid = Number(fs.readFileSync(lock, 'utf8'));
  try { process.kill(pid, 0); throw new Error('DATA_DIR is already in use by another server'); }
  catch (error) { if (error.code !== 'ESRCH') throw error; }
  fs.unlinkSync(lock);
} catch (error) { if (error.code !== 'ENOENT') throw error; }
fs.writeFileSync(lock, String(process.pid), { flag: 'wx' });
process.on('exit', () => {
  try { fs.unlinkSync(lock); } catch (error) { if (error.code !== 'ENOENT') console.error('Unable to release data directory lock:', error.message); }
});

export function readStore(name, fallback) {
  const file = path.join(dataDir, `${name}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
}

export function writeStore(name, value) {
  const file = path.join(dataDir, `${name}.json`);
  const temporary = `${file}.tmp`;
  const fd = fs.openSync(temporary, 'w', 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(value)); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  fs.renameSync(temporary, file);
}
