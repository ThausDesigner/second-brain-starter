import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import { resolve, join, extname } from 'node:path';
const root = resolve(process.env.SECOND_BRAIN_PREVIEW_DIR || '.');
const port = Number(process.env.PORT || 4187);
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.includes('..') || pathname.includes('\\')) { res.writeHead(400).end(); return; }
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!['index.html', 'second-brain-starter.zip', 'second-brain-starter.zip.sha256', 'release.json'].includes(relative)) { res.writeHead(404).end(); return; }
    const data = await fs.readFile(join(root, relative));
    res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html; charset=utf-8', '.zip': 'application/zip', '.json': 'application/json' })[extname(relative)] || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Local: http://localhost:${port}`));
