// Todo lo que habla con Notion. El guion bajo hace que Vercel no lo publique como ruta.
import { timingSafeEqual, createHash } from 'node:crypto';
import { ESTACIONES, GENERAL, INVENTARIO } from '../datos/estaciones.js';
import { demoEstado, demoTildar } from '../datos/demo.js';

const API = 'https://api.notion.com/v1';
const VERSION = '2025-09-03';
const VERSION_VIEJA = '2022-06-28'; // por si la cuenta todavía no tiene data sources

export class ErrorNotion extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

const esDemo = () => process.env.MECHA_DEMO === '1';
const sinGuiones = (id) => String(id || '').replace(/-/g, '').toLowerCase();

async function pedir(ruta, { method = 'GET', body, version = VERSION } = {}) {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new ErrorNotion(503, 'Falta NOTION_TOKEN en Vercel');
  for (let intento = 0; intento < 3; intento++) {
    const r = await fetch(API + ruta, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': version,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 429) {
      const espera = Math.min(Number(r.headers.get('retry-after')) || 1, 3);
      await new Promise((ok) => setTimeout(ok, espera * 1000));
      continue;
    }
    const datos = await r.json().catch(() => ({}));
    if (r.status === 401) throw new ErrorNotion(502, 'Notion rechazó NOTION_TOKEN');
    if (!r.ok) throw new ErrorNotion(r.status, datos.message || `Notion respondió ${r.status}`);
    return datos;
  }
  throw new ErrorNotion(429, 'Notion está saturado; probá en un minuto');
}

// Todas las filas de una base, página por página.
async function filas(base) {
  const todas = [];
  let cursor;
  let vieja = false;
  do {
    const body = { page_size: 100, ...(cursor && { start_cursor: cursor }) };
    let r;
    if (!vieja) {
      try {
        r = await pedir(`/data_sources/${base.fuente}/query`, { method: 'POST', body });
      } catch (e) {
        if (e.status !== 400 && e.status !== 404) throw e;
        vieja = true;
      }
    }
    if (vieja) {
      try {
        r = await pedir(`/databases/${base.base}/query`, { method: 'POST', body, version: VERSION_VIEJA });
      } catch (e) {
        if (e.status === 404) throw new ErrorNotion(404, 'Notion no encuentra una base. ¿La integración está conectada a "Tesis Mecha"?');
        throw e;
      }
    }
    todas.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return todas.filter((p) => !p.archived && !p.in_trash);
}

const texto = (prop) => (prop?.title ?? prop?.rich_text ?? []).map((t) => t.plain_text).join('').trim();
const titulo = (p) => texto(Object.values(p.properties).find((x) => x.type === 'title'));
const opcion = (prop) => prop?.select?.name ?? prop?.status?.name ?? null;

// Filas que quedaron para borrar a mano (🗑️ BORRAR) o en pausa (⏸️ FUTURO): no son trabajo de hoy.
const oculta = (t) => !t || t.startsWith('🗑') || t.includes('BORRAR') || t.startsWith('⏸');

function tarea(p) {
  const pr = p.properties;
  return {
    id: p.id,
    titulo: titulo(p),
    estado: opcion(pr.Estado) ?? 'Por hacer',
    fase: opcion(pr.Fase),
    mundo: opcion(pr.Mundo),
    parte: opcion(pr.Parte),
  };
}

function item(p) {
  const pr = p.properties;
  return {
    id: p.id,
    item: titulo(p),
    estado: opcion(pr.Estado),
    estaciones: (pr['Estación']?.multi_select ?? []).map((o) => o.name),
    cantidad: pr.Cantidad?.number ?? null,
    notas: texto(pr.Notas) || null,
  };
}

const ORDEN = { Bloqueada: 0, 'Por hacer': 1, Hecha: 2 };
const porEstado = (a, b) => (ORDEN[a.estado] ?? 1) - (ORDEN[b.estado] ?? 1) || a.titulo.localeCompare(b.titulo, 'es');

const conTareas = () => [...ESTACIONES.filter((e) => e.notion), GENERAL];

export async function leerEstado() {
  if (esDemo()) return demoEstado();
  const [inventario, ...porEstacion] = await Promise.all([
    filas(INVENTARIO),
    ...conTareas().map((e) => filas(e.notion)),
  ]);
  const items = inventario.map(item).filter((i) => !oculta(i.item));
  const estaciones = {};
  conTareas().forEach((e, n) => {
    estaciones[e.id] = {
      tareas: porEstacion[n].map(tarea).filter((t) => !oculta(t.titulo) && t.estado !== 'Descartada').sort(porEstado),
      inventario: items.filter((i) => i.estaciones.includes(e.inventario)),
    };
  });
  return { leido: new Date().toISOString(), estaciones };
}

// J20: la web solo pasa una tarea entre Por hacer y Hecha. Bloqueada y Descartada se cambian en Notion.
export async function tildar(id, hecha) {
  if (esDemo()) return demoTildar(id, hecha);
  const pagina = await pedir(`/pages/${id}`);
  const padre = sinGuiones(pagina.parent?.data_source_id ?? pagina.parent?.database_id);
  const valida = conTareas().some((e) => padre === sinGuiones(e.notion.fuente) || padre === sinGuiones(e.notion.base));
  if (!valida || pagina.archived || pagina.in_trash) throw new ErrorNotion(403, 'Esa tarea no es de ninguna estación');
  const actual = opcion(pagina.properties.Estado) ?? 'Por hacer';
  if (actual === 'Bloqueada' || actual === 'Descartada') throw new ErrorNotion(409, `Está ${actual}: eso se cambia en Notion`);
  const nuevo = hecha ? 'Hecha' : 'Por hacer';
  if (actual !== nuevo) {
    await pedir(`/pages/${id}`, { method: 'PATCH', body: { properties: { Estado: { select: { name: nuevo } } } } });
  }
  return { id, estado: nuevo };
}

export function claveCorrecta(dada) {
  const clave = process.env.MECHA_CLAVE;
  if (!clave) throw new ErrorNotion(503, 'Falta MECHA_CLAVE en Vercel');
  const a = createHash('sha256').update(String(dada ?? '')).digest();
  const b = createHash('sha256').update(clave).digest();
  return timingSafeEqual(a, b);
}

export function responderError(res, e) {
  let status = 500;
  if (typeof e.status === 'number') status = e.status === 503 ? 503 : e.status >= 500 || e.status === 429 ? 502 : e.status;
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json({ error: e.message || 'Error inesperado' });
}
