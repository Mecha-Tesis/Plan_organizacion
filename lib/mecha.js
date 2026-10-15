// Lógica compartida entre la página y las funciones: cómo se lee el estado de una estación.
import { ESTACIONES, GENERAL, MUESTRA, ACTUALIZADO } from '../datos/estaciones.js';

export const COLORES = {
  lista: 'Lista',
  falta: 'Falta',
  bloqueada: 'Algo bloqueado',
  nada: 'Sin datos',
};

// J21: gris sin datos, rojo si algo está Bloqueada, amarillo si falta algo, verde si está todo Hecha.
export function colorDe(tareas) {
  if (!tareas || tareas.length === 0) return 'nada';
  if (tareas.some((t) => t.estado === 'Bloqueada')) return 'bloqueada';
  if (tareas.some((t) => t.estado !== 'Hecha')) return 'falta';
  return 'lista';
}

// J22: qué falta = lo que no está Hecha. Qué se necesita = Inventario sin Confirmado.
export const falta = (tareas = []) => tareas.filter((t) => t.estado !== 'Hecha');
export const hechas = (tareas = []) => tareas.filter((t) => t.estado === 'Hecha');
export const necesita = (items = []) => items.filter((i) => i.estado !== 'Confirmado');

export function diasHasta(fecha = MUESTRA, hoy = new Date()) {
  const fin = new Date(`${fecha}T00:00:00-03:00`);
  return Math.max(0, Math.ceil((fin - hoy) / 86400000));
}

export function horaArgentina(iso) {
  return new Date(iso).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

// Lo fijo y lo vivo juntos, para /mecha.json.
export function armarMecha(vivo, error) {
  const una = (fijo) => {
    const v = vivo?.estaciones?.[fijo.id];
    const tareas = v?.tareas ?? null;
    return {
      id: fijo.id,
      nombre: fijo.nombre,
      titulo: fijo.titulo ?? null,
      tipo: fijo.tipo ?? 'general',
      que_es: fijo.que,
      quien: fijo.quien,
      lo_ultimo: fijo.ultimo ?? null,
      confirmado: fijo.confirmado,
      color: fijo.notion ? colorDe(tareas) : 'lugar',
      tareas,
      que_se_necesita: v ? necesita(v.inventario) : null,
    };
  };
  return {
    proyecto: 'MECHA',
    muestra: MUESTRA,
    faltan_dias: diasHasta(),
    fijo_actualizado: ACTUALIZADO,
    leido_de_notion: vivo?.leido ?? null,
    error_notion: error ?? null,
    demo: Boolean(vivo?.demo),
    estaciones: ESTACIONES.map(una),
    general: { ...una(GENERAL), partes: agruparPorParte(vivo?.estaciones?.general?.tareas) },
  };
}

export function agruparPorParte(tareas) {
  if (!tareas) return null;
  const grupos = {};
  for (const t of tareas) (grupos[t.parte || 'Sin parte'] ??= []).push(t);
  return grupos;
}

// Lo mismo en texto plano, para pasarle a una IA.
export function aMarkdown(m) {
  const l = [];
  l.push('# MECHA — dónde está el proyecto');
  l.push('');
  l.push('Bar inmersivo en un aula de 6 × 6 m: tres visitantes, unos 25 minutos, cinco estaciones con tarjeta RFID');
  l.push('(tejo, booth, baño, cuadro, rocola) y un karaoke que se desbloquea al final. La barra es un lugar, no una estación.');
  l.push('');
  l.push(`- Muestra: semana del 20/12/2026. Faltan ${m.faltan_dias} días.`);
  if (m.demo) l.push('- **DEMO: estos datos son de prueba, no salen de Notion.**');
  if (m.leido_de_notion) l.push(`- Estado leído de Notion: ${horaArgentina(m.leido_de_notion)} (hora de Argentina).`);
  if (m.error_notion) l.push(`- **No se pudo leer Notion** (${m.error_notion}). Solo está lo fijo.`);
  l.push(`- Lo fijo de cada estación se actualizó el ${m.fijo_actualizado}. "A confirmar" quiere decir que todavía no se revisó.`);
  l.push('');
  l.push('Cómo leer esto: "Qué falta" son las tareas de Notion que no están Hecha. "Qué se necesita" es el hardware del');
  l.push('Inventario técnico que todavía no está Confirmado. "Lo último" es lo que contó Ana; si choca con las tareas, manda lo último.');

  const tareas = (lista) => lista.map((t) => `- [${t.estado === 'Hecha' ? 'x' : ' '}] ${t.titulo}${t.estado === 'Bloqueada' ? ' — **Bloqueada**' : ''}${t.fase ? ` · ${t.fase}` : ''} · ${t.quien ? `se encarga ${t.quien}` : 'sin nadie'}`);
  const items = (lista) => lista.map((i) => `- ${i.item}${i.cantidad ? ` ×${i.cantidad}` : ''} — ${i.estado ?? 'sin estado'}${i.notas ? `. ${i.notas}` : ''}`);

  const bloque = (e) => {
    l.push('');
    l.push(`## ${e.nombre}${e.titulo ? ` — ${e.titulo}` : ''}`);
    l.push('');
    l.push(`- Qué es: ${e.que_es}`);
    l.push(`- Quién: ${e.quien.join(', ')}`);
    if (e.lo_ultimo) l.push(`- Lo último: ${e.lo_ultimo}`);
    if (!e.confirmado) l.push('- Ficha a confirmar.');
    if (e.color === 'lugar') return;
    l.push(`- Estado: ${COLORES[e.color]}${e.tareas ? ` (${hechas(e.tareas).length} de ${e.tareas.length} tareas hechas)` : ''}`);
    if (!e.tareas) return;
    const pendientes = falta(e.tareas);
    l.push('');
    l.push('### Qué falta');
    l.push(...(pendientes.length ? tareas(pendientes) : ['- Nada.']));
    const listas = hechas(e.tareas);
    if (listas.length) {
      l.push('');
      l.push('### Hecho');
      l.push(...tareas(listas));
    }
    l.push('');
    l.push('### Qué se necesita');
    l.push(...(e.que_se_necesita.length ? items(e.que_se_necesita) : ['- Nada sin confirmar en el Inventario.']));
  };

  m.estaciones.forEach(bloque);
  bloque(m.general);
  l.push('');
  return l.join('\n');
}
