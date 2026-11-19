import { promises as fs } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { scaffold } from '../lib/template.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const stage = join(root, '.local', `release-${randomUUID()}`);
const dist = join(root, 'dist');
await fs.mkdir(stage, { recursive: true });
await scaffold(join(stage, 'vault'), { profile: 'custom' });
for (const path of ['bin', 'lib', 'scripts', 'docs', 'test', 'package.json', 'package-lock.json', 'README.md', 'LICENSE', 'index.html', 'vercel.json', '.github', '.gitignore', '.vercelignore']) {
  try { await fs.cp(join(root, path), join(stage, 'installer', path), { recursive: true, errorOnExist: true, force: false }); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
await fs.copyFile(join(root, 'index.html'), join(stage, 'index.html'));
await fs.copyFile(join(root, 'docs/HANDOFF.md'), join(stage, 'HANDOFF.md'));
await fs.copyFile(join(root, 'LICENSE'), join(stage, 'LICENSE'));

// Portable ZIP writer (stored entries): no Python, external archive tools or runtime packages required.
const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
const crc32 = bytes => { let crc = 0xffffffff; for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8); return (crc ^ 0xffffffff) >>> 0; };
const entries = [];
async function walk(folder) {
  for (const item of await fs.readdir(folder, { withFileTypes: true })) {
    const path = join(folder, item.name);
    if (item.isSymbolicLink()) throw new Error('Release cannot include symbolic links.');
    if (item.isDirectory()) await walk(path);
    else entries.push({ name: Buffer.from(relative(stage, path).replaceAll('\\', '/')), data: await fs.readFile(path) });
  }
}
await walk(stage);
const local = [], central = [];
let offset = 0;
for (const { name, data } of entries) {
  const crc = crc32(data);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x800, 6);
  header.writeUInt16LE(33, 12); header.writeUInt32LE(crc, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(name.length, 26);
  const record = Buffer.alloc(46);
  record.writeUInt32LE(0x02014b50, 0); record.writeUInt16LE(20, 4); record.writeUInt16LE(20, 6); record.writeUInt16LE(0x800, 8);
  record.writeUInt16LE(33, 14); record.writeUInt32LE(crc, 16); record.writeUInt32LE(data.length, 20); record.writeUInt32LE(data.length, 24); record.writeUInt16LE(name.length, 28); record.writeUInt32LE(offset, 42);
  local.push(header, name, data); central.push(record, name); offset += header.length + name.length + data.length;
}
const directory = Buffer.concat(central), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
const archive = Buffer.concat([...local, directory, end]);
const hash = createHash('sha256').update(archive).digest('hex');
await fs.mkdir(dist, { recursive: true });
await fs.writeFile(join(dist, 'second-brain-starter.zip'), archive);
await fs.writeFile(join(dist, 'second-brain-starter.zip.sha256'), `${hash}  second-brain-starter.zip\n`);
await fs.copyFile(join(root, 'index.html'), join(dist, 'index.html'));
await fs.writeFile(join(dist, 'release.json'), JSON.stringify({ version: '1.0.1', files: entries.length, bytes: archive.length, sha256: hash }, null, 2));
console.log(JSON.stringify({ directory: dist, archive: 'second-brain-starter.zip', entries: entries.length, bytes: archive.length, sha256: hash }));
