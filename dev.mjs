// Para probar la web en tu compu sin Vercel: `node dev.mjs` (lee .env.local)
// o `node dev.mjs --demo` (datos de prueba, sin Notion). Abre en http://localhost:3000.
// Imita lo poco que usan las funciones de Vercel: req.query, req.body, res.status/json/send.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = fileURLToPath(new URL('.', import.meta.url));
const PUERTO = Number(process.env.PORT) || 3000;

if (existsSync(join(RAIZ, '.env.local'))) {
  for (const linea of readFileSync(join(RAIZ, '.env.local'), 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
if (process.argv.includes('--demo')) {
  process.env.MECHA_DEMO = '1';
  process.env.MECHA_CLAVE ||= 'demo';
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.md': 'text/markdown; charset=utf-8' };
const REESCRITURAS = { '/mecha.md': '/api/mecha?formato=md', '/mecha.json': '/api/mecha?formato=json' };

function adaptar(res) {
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (d) => { if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(d)); return res; };
  res.send = (d) => { res.end(d); return res; };
  return res;
}

createServer(async (req, res) => {
  const url = new URL(REESCRITURAS[req.url.split('?')[0]] ?? req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) {
      const nombre = url.pathname.slice(5).replace(/[^a-z]/g, '');
      const archivo = join(RAIZ, 'api', `${nombre}.js`);
      if (!nombre || !existsSync(archivo)) return adaptar(res).status(404).json({ error: 'No existe' });
      let cuerpo = '';
      for await (const pedazo of req) cuerpo += pedazo;
      req.query = Object.fromEntries(url.searchParams);
      req.body = cuerpo && req.headers['content-type']?.includes('json') ? JSON.parse(cuerpo) : undefined;
      const { default: handler } = await import(pathToFileURL(archivo).href);
      return await handler(req, adaptar(res));
    }
    const ruta = normalize(join(RAIZ, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)));
    if (!ruta.startsWith(RAIZ) || ruta.includes(`${RAIZ}api`)) return adaptar(res).status(404).send('No existe');
    const datos = await readFile(ruta);
    res.setHeader('Content-Type', TIPOS[extname(ruta)] ?? 'application/octet-stream');
    res.end(datos);
  } catch (e) {
    if (e.code === 'ENOENT') return adaptar(res).status(404).send('No existe');
    console.error(e);
    adaptar(res).status(500).json({ error: e.message });
  }
}).listen(PUERTO, () => {
  console.log(`MECHA en http://localhost:${PUERTO}${process.env.MECHA_DEMO === '1' ? '  (DEMO, clave: demo)' : ''}`);
});
