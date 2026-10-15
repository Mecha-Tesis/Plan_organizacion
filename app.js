// La página: dibuja la planta, abre la ficha de cada estación y tilda en Notion.
import { ESTACIONES, GENERAL, LUGARES, ENTRADA, EQUIPO } from './datos/estaciones.js';
import { COLORES, colorDe, falta, hechas, necesita, diasHasta, horaArgentina, agruparPorParte } from './lib/mecha.js';

const TOPE = 5; // J9: ninguna lista pasa de cinco sin un "ver más"
const REFRESCO = 45_000;
const TIPOS = { libre: 'Estación libre', mozo: 'Te lleva el mozo', final: 'El final', lugar: 'Lugar' };

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let vivo = null; // lo último que respondió /api/estado
let error = null;
let abierta = null; // id de la estación con la ficha abierta
let pidiendoClave = null; // { donde, seguir } mientras se espera la clave
let errorClave = '';
const pendientes = new Map(); // tildes mandados que Notion todavía no devolvió
const pendientesQuien = new Map(); // lo mismo para "Quién"
const enviando = new Set();
let redibujarAlSoltar = false; // no se redibuja con un menú de "Quién" abierto
const expandidos = new Set();

// J24: la clave queda en este navegador.
const CLAVE = 'mecha-clave';
const leerClave = () => { try { return localStorage.getItem(CLAVE); } catch { return null; } };
const guardarClave = (v) => { try { localStorage.setItem(CLAVE, v); } catch {} };
const borrarClave = () => { try { localStorage.removeItem(CLAVE); } catch {} };

function tareasDe(id) {
  const lista = vivo?.estaciones?.[id]?.tareas;
  if (!lista) return null;
  const vigente = (m, id) => { const p = m.get(id); return p && p.hasta > Date.now() ? p : null; };
  return lista.map((t) => {
    const p = vigente(pendientes, t.id);
    const q = vigente(pendientesQuien, t.id);
    return { ...t, ...(p && { estado: p.estado }), ...(q && { quien: q.quien }) };
  });
}
const inventarioDe = (id) => vivo?.estaciones?.[id]?.inventario ?? null;
const colorEstacion = (e) => (e.notion ? colorDe(tareasDe(e.id)) : 'lugar');
const cuenta = (tareas) => (tareas ? `${hechas(tareas).length}/${tareas.length}` : '');

/* ---------- La planta ---------- */

function dibujarPlanta() {
  const p = [];
  p.push('<rect class="piso" x="0" y="0" width="600" height="600"/>');
  for (let m = 100; m < 600; m += 100) {
    p.push(`<line class="grilla" x1="${m}" y1="0" x2="${m}" y2="600"/><line class="grilla" x1="0" y1="${m}" x2="600" y2="${m}"/>`);
  }
  p.push(`<path class="pared" d="M${ENTRADA.desde} 600 H0 V0 H600 V600 H${ENTRADA.hasta}"/>`);
  const medio = (ENTRADA.desde + ENTRADA.hasta) / 2;
  p.push(`<path class="flecha" d="M${medio} 646 V614 M${medio - 9} 624 L${medio} 614 L${medio + 9} 624"/>`);
  p.push(`<text class="entrada-texto" x="${medio}" y="664" text-anchor="middle">entrada</text>`);
  p.push('<text class="metro" x="600" y="-8" text-anchor="end">6 × 6 m</text>');

  for (const l of LUGARES) {
    const { x, y, w, h } = l.zona;
    p.push(`<g class="mueble"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/>
      <text x="${x + w / 2}" y="${y + h / 2 - 2}" text-anchor="middle">${esc(l.nombre)}</text>
      <text class="zona-sub" x="${x + w / 2}" y="${y + h / 2 + 20}" text-anchor="middle">${esc(l.titulo)}</text></g>`);
  }

  for (const e of ESTACIONES) {
    const { x, y, w, h } = e.zona;
    const color = colorEstacion(e);
    const tareas = tareasDe(e.id);
    const sub = e.notion && tareas ? `${cuenta(tareas)} hechas` : '';
    const etiqueta = e.notion ? `${e.nombre}: ${COLORES[color]}${tareas ? `, ${cuenta(tareas)} tareas hechas` : ''}` : `${e.nombre}: ${e.que}`;
    p.push(`<g class="zona ${color} ${e.tipo}" data-abrir="${e.id}" tabindex="0" role="button" aria-label="${esc(etiqueta)}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14"/>
      <text class="zona-nombre" x="${x + w / 2}" y="${y + h / 2 + (sub ? -2 : 8)}" text-anchor="middle">${esc(e.nombre)}</text>
      ${sub ? `<text class="${e.notion ? 'zona-cuenta' : 'zona-sub'}" x="${x + w / 2}" y="${y + h / 2 + 22}" text-anchor="middle">${esc(sub)}</text>` : ''}
    </g>`);
  }
  $('#planta').innerHTML = p.join('');
}

function dibujarLista() {
  $('#lista').innerHTML = ESTACIONES.filter((e) => e.notion).map((e) => {
    const tareas = tareasDe(e.id);
    const color = colorEstacion(e);
    const pct = tareas?.length ? Math.round((hechas(tareas).length / tareas.length) * 100) : 0;
    return `<li><button class="estacion" data-abrir="${e.id}" style="--c: var(--${color})">
      <i class="punto ${color}"></i><span class="nombre">${esc(e.nombre)}</span>
      <span class="cuenta-e">${tareas ? `${cuenta(tareas)}` : '—'}</span>
      <span class="barrita"><i style="width:${pct}%"></i></span>
    </button></li>`;
  }).join('');
}

/* ---------- Listas ---------- */

function listaTareas(lista, clave, donde) {
  if (!lista.length) return '<p class="vacio">Nada.</p>';
  const visibles = expandidos.has(clave) ? lista : lista.slice(0, TOPE);
  const filas = visibles.map((t) => {
    const hecha = t.estado === 'Hecha';
    const bloq = t.estado === 'Bloqueada';
    const apagada = bloq || Boolean(error) || enviando.has(t.id);
    return `<li class="tarea${hecha ? ' hecha' : ''}${enviando.has(t.id) ? ' enviando' : ''}">
      <label><input type="checkbox" data-tarea="${t.id}" data-donde="${donde}" ${hecha ? 'checked' : ''} ${apagada ? 'disabled' : ''}
        aria-label="${esc(t.titulo)}${bloq ? ' (bloqueada: se cambia en Notion)' : ''}">
      <span class="texto">${esc(t.titulo)}</span></label>
      ${bloq ? '<span class="etiqueta bloq">Bloqueada</span>' : ''}
      ${t.fase === 'Instalación' && !bloq ? '<span class="etiqueta inst">en el aula</span>' : ''}
      ${elegirQuien(t)}
    </li>`;
  }).join('');
  const resto = lista.length - visibles.length;
  return `<ul class="tareas">${filas}</ul>${resto > 0 ? `<button class="ver-mas" data-expandir="${clave}">Ver ${resto} más</button>` : ''}`;
}

// J32: al lado de cada tarea se elige quién se encarga. Se guarda en la propiedad "Quién" de Notion.
function elegirQuien(t) {
  const nombres = t.quien && !EQUIPO.includes(t.quien) ? [...EQUIPO, t.quien] : EQUIPO;
  const apagado = Boolean(error) || enviando.has(`${t.id}:quien`);
  return `<select class="quien${t.quien ? '' : ' nadie'}" data-quien-de="${t.id}" ${apagado ? 'disabled' : ''}
      aria-label="Quién se encarga de ${esc(t.titulo)}">
    <option value=""${t.quien ? '' : ' selected'}>¿Quién?</option>
    ${nombres.map((n) => `<option${n === t.quien ? ' selected' : ''}>${esc(n)}</option>`).join('')}
  </select>`;
}

function listaItems(lista, clave) {
  if (!lista.length) return '<p class="vacio">Nada sin confirmar en el Inventario.</p>';
  const visibles = expandidos.has(clave) ? lista : lista.slice(0, TOPE);
  const filas = visibles.map((i) => `<li><span>${esc(i.item)}${i.cantidad > 1 ? ` ×${i.cantidad}` : ''}
      ${i.notas ? `<span class="notas">${esc(i.notas)}</span>` : ''}</span>
      <span class="est${i.estado === 'Por conseguir' ? ' conseguir' : ''}">${esc(i.estado ?? 'sin estado')}</span></li>`).join('');
  const resto = lista.length - visibles.length;
  return `<ul class="items">${filas}</ul>${resto > 0 ? `<button class="ver-mas" data-expandir="${clave}">Ver ${resto} más</button>` : ''}`;
}

function bloqueHechas(lista, clave, donde) {
  if (!lista.length) return '';
  return `<details class="hechas"${expandidos.has(`${clave}-abierto`) ? ' open' : ''} data-detalle="${clave}-abierto">
    <summary>Hechas (${lista.length})</summary>${listaTareas(lista, clave, donde)}</details>`;
}

function formClave(donde) {
  if (pidiendoClave?.donde !== donde) return '';
  return `<form class="clave" data-clave>
    <p>Para tildar hace falta la clave del equipo. Se pide una sola vez en este celular.</p>
    <div class="fila"><input type="password" name="clave" autocomplete="current-password" placeholder="Clave" aria-label="Clave del equipo" required>
    <button class="boton primario">Tildar</button></div>
    ${errorClave ? `<p class="error">${esc(errorClave)}</p>` : ''}
  </form>`;
}

const sinNotion = () => `<p class="vacio">${error ? 'No pude leer Notion.' : 'Leyendo Notion…'}</p>`;

/* ---------- General ---------- */

function dibujarGeneral() {
  $('#general-que').textContent = GENERAL.que;
  const tareas = tareasDe('general');
  if (!tareas) return void ($('#general-cuerpo').innerHTML = sinNotion());
  const partes = agruparPorParte(tareas);
  const html = Object.entries(partes).map(([parte, lista]) => `<div class="parte">
      <h3>${esc(parte)} · ${cuenta(lista)}</h3>
      ${falta(lista).length ? listaTareas(falta(lista), `general-${parte}`, 'general') : '<p class="vacio">Todo hecho.</p>'}
      ${bloqueHechas(hechas(lista), `general-${parte}-hechas`, 'general')}
    </div>`).join('');
  $('#general-cuerpo').innerHTML = `${formClave('general')}${html}
    <div class="parte"><h3>Qué se necesita</h3>${listaItems(necesita(inventarioDe('general') ?? []), 'general-inv')}</div>`;
}

/* ---------- La ficha de cada estación ---------- */

function dibujarFicha() {
  if (!abierta) return;
  const e = ESTACIONES.find((x) => x.id === abierta);
  const tareas = tareasDe(e.id);
  const color = colorEstacion(e);
  const partes = [];
  partes.push(`<p class="ficha-tipo">${TIPOS[e.tipo]}</p>
    <h2 id="ficha-titulo">${esc(e.nombre)}</h2><p class="titulo-carta">${esc(e.titulo)}</p>
    <div class="estado-linea">
      ${e.notion ? `<span class="chip"><i class="punto ${color}"></i>${COLORES[color]}${tareas ? ` · ${cuenta(tareas)} hechas` : ''}</span>` : ''}
      ${e.confirmado ? '' : '<span class="chip confirmar">Ficha a confirmar</span>'}
    </div>`);
  partes.push(`<section><h3>Qué es</h3><p>${esc(e.que)}</p></section>`);
  partes.push(`<section><p class="ultimo"><small>Lo último que contó Ana · 15/10</small>${esc(e.ultimo)}</p></section>`);
  if (e.notion) {
    partes.push(`<section><h3>Qué falta producir</h3>${formClave(e.id)}
      ${tareas ? listaTareas(falta(tareas), `${e.id}-falta`, e.id) + bloqueHechas(hechas(tareas), `${e.id}-hechas`, e.id) : sinNotion()}</section>`);
    const inv = inventarioDe(e.id);
    partes.push(`<section><h3>Qué se necesita</h3>${inv ? listaItems(necesita(inv), `${e.id}-inv`) : sinNotion()}</section>`);
  }
  partes.push(`<section><h3>Quién</h3><p>${e.quien.map(esc).join(', ')}</p></section>`);

  const ficha = $('#ficha');
  const scroll = ficha.scrollTop;
  const { tarea: foco, quienDe } = document.activeElement?.dataset ?? {};
  $('#ficha-cuerpo').innerHTML = partes.join('');
  ficha.scrollTop = scroll;
  if (foco) ficha.querySelector(`[data-tarea="${foco}"]`)?.focus();
  if (quienDe) ficha.querySelector(`[data-quien-de="${quienDe}"]`)?.focus();
}

function abrir(id) {
  if (!ESTACIONES.some((e) => e.id === id)) return;
  abierta = id;
  dibujarFicha();
  const ficha = $('#ficha');
  if (!ficha.open) ficha.showModal();
  history.replaceState(null, '', `#${id}`);
}

/* ---------- Estado general de la página ---------- */

function dibujarCabecera() {
  $('#dias').textContent = diasHasta();
  const aviso = $('#aviso');
  if (error) {
    aviso.hidden = false;
    aviso.className = 'aviso error';
    aviso.textContent = `No pude leer Notion (${error}). La planta y lo fijo se ven igual; tildar no anda hasta que vuelva.`;
  } else if (vivo?.demo) {
    aviso.hidden = false;
    aviso.className = 'aviso';
    aviso.textContent = 'DEMO: estos datos son de prueba, no salen de Notion.';
  } else {
    aviso.hidden = true;
  }
  $('#leido').textContent = vivo?.leido ? `Notion · leído ${horaArgentina(vivo.leido)}` : error ? 'Sin Notion' : 'Leyendo Notion…';
}

function dibujar() {
  dibujarCabecera();
  dibujarPlanta();
  dibujarLista();
  dibujarGeneral();
  dibujarFicha();
}

async function cargar() {
  try {
    const r = await fetch('/api/estado', { cache: 'no-store' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `respondió ${r.status}`);
    vivo = d;
    error = null;
    // Lo que Notion ya devuelve con el estado nuevo deja de estar pendiente.
    const todas = Object.values(vivo.estaciones).flatMap((x) => x.tareas);
    for (const [mapa, campo] of [[pendientes, 'estado'], [pendientesQuien, 'quien']]) {
      for (const [id, p] of mapa) {
        const t = todas.find((x) => x.id === id);
        if (!t || t[campo] === p[campo] || p.hasta < Date.now()) mapa.delete(id);
      }
    }
  } catch (e) {
    error = e.message === 'Failed to fetch' ? 'sin conexión' : e.message;
  }
  // Redibujar cierra el menú que alguien tiene abierto: se espera a que lo suelte.
  if (document.activeElement?.matches?.('select[data-quien-de]')) redibujarAlSoltar = true;
  else dibujar();
}

/* ---------- Tildar ---------- */

let tiempoTostada;
function tostada(texto, esError = false) {
  const t = $('#tostada');
  t.textContent = texto;
  t.classList.toggle('error', esError);
  try { t.hidePopover(); t.showPopover(); } catch {}
  clearTimeout(tiempoTostada);
  tiempoTostada = setTimeout(() => { try { t.hidePopover(); } catch {} }, 3200);
}

// Manda un cambio a Notion. Mientras viaja, la página ya lo muestra; si falla, vuelve atrás.
async function guardar(cambio) {
  const { ruta, cuerpo, mapa, valor, marca, donde, listo } = cambio;
  const seguir = () => guardar(cambio);
  const clave = leerClave();
  if (!clave) {
    pidiendoClave = { donde, seguir };
    dibujar();
    document.querySelector('[data-clave] input')?.focus();
    return;
  }
  const id = cuerpo.id;
  mapa.set(id, { ...valor, hasta: Date.now() + 90_000 });
  enviando.add(marca);
  dibujar();
  try {
    const r = await fetch(ruta, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Mecha-Clave': clave },
      body: JSON.stringify(cuerpo),
    });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401 && d.codigo === 'clave') {
      mapa.delete(id);
      borrarClave();
      errorClave = 'La clave no es esa.';
      pidiendoClave = { donde, seguir };
    } else if (!r.ok) {
      mapa.delete(id);
      tostada(d.error || 'No se pudo guardar', true);
    } else {
      tostada(listo);
    }
  } catch {
    mapa.delete(id);
    tostada('Sin conexión: no se guardó.', true);
  } finally {
    enviando.delete(marca);
    dibujar();
    if (pidiendoClave) document.querySelector('[data-clave] input')?.focus();
  }
}

const tildar = (id, hecha, donde) => guardar({
  ruta: '/api/tildar', cuerpo: { id, hecha }, mapa: pendientes, valor: { estado: hecha ? 'Hecha' : 'Por hacer' },
  marca: id, donde, listo: hecha ? 'Tildada. En Notion ya figura Hecha.' : 'Destildada. Vuelve a Por hacer.',
});

const asignar = (id, quien, donde) => guardar({
  ruta: '/api/asignar', cuerpo: { id, quien }, mapa: pendientesQuien, valor: { quien },
  marca: `${id}:quien`, donde, listo: quien ? `Se encarga ${quien}.` : 'Quedó sin nadie.',
});

/* ---------- Eventos ---------- */

document.addEventListener('click', (ev) => {
  const abrirEn = ev.target.closest('[data-abrir]');
  if (abrirEn) return abrir(abrirEn.dataset.abrir);
  const mas = ev.target.closest('[data-expandir]');
  if (mas) {
    expandidos.add(mas.dataset.expandir);
    dibujar();
  }
});

document.addEventListener('keydown', (ev) => {
  const zona = ev.target.closest?.('g[data-abrir]');
  if (zona && (ev.key === 'Enter' || ev.key === ' ')) {
    ev.preventDefault();
    abrir(zona.dataset.abrir);
  }
});

document.addEventListener('change', (ev) => {
  const caja = ev.target.closest('[data-tarea]');
  if (caja) return tildar(caja.dataset.tarea, caja.checked, caja.dataset.donde);
  const menu = ev.target.closest('[data-quien-de]');
  if (menu) {
    redibujarAlSoltar = false;
    asignar(menu.dataset.quienDe, menu.value || null, menu.closest('#ficha') ? abierta : 'general');
  }
});

document.addEventListener('focusout', (ev) => {
  if (redibujarAlSoltar && ev.target.matches?.('select[data-quien-de]')) {
    redibujarAlSoltar = false;
    setTimeout(dibujar);
  }
});

document.addEventListener('toggle', (ev) => {
  const d = ev.target.closest?.('[data-detalle]');
  if (d) d.open ? expandidos.add(d.dataset.detalle) : expandidos.delete(d.dataset.detalle);
}, true);

document.addEventListener('submit', (ev) => {
  const form = ev.target.closest('[data-clave]');
  if (!form) return;
  ev.preventDefault();
  const valor = form.clave.value.trim();
  if (!valor) return;
  guardarClave(valor);
  errorClave = '';
  const { seguir } = pidiendoClave;
  pidiendoClave = null;
  seguir();
});

const ficha = $('#ficha');
ficha.addEventListener('click', (ev) => { if (ev.target === ficha) ficha.close(); });
ficha.addEventListener('close', () => {
  if (pidiendoClave?.donde === abierta) { pidiendoClave = null; errorClave = ''; }
  abierta = null;
  history.replaceState(null, '', location.pathname);
});

const link = `${location.origin}/mecha.md`;
$('#link-ia').textContent = link;
$('#copiar').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(link);
    tostada('Link copiado.');
  } catch {
    tostada(link);
  }
});

document.addEventListener('visibilitychange', () => { if (!document.hidden) cargar(); });
setInterval(() => { if (!document.hidden) cargar(); }, REFRESCO);

dibujar();
if (location.hash) abrir(location.hash.slice(1));
cargar();
