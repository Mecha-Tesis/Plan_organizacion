// Datos de prueba para mirar la web sin Notion: se activan solo con MECHA_DEMO=1.
// Los títulos salen de las fichas viejas de Estaciones/; los estados son inventados.
// En Vercel no se usa: allá MECHA_DEMO no está puesta.

let n = 0;
const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
const t = (titulo, estado = 'Por hacer', fase = 'Producción', parte = null) => ({ id: id(), titulo, estado, fase, mundo: null, parte });
const i = (item, estado, estaciones, cantidad = 1, notas = null) => ({ id: id(), item, estado, estaciones, cantidad, notas });

const inventario = [
  i('Kinect v2 + adaptador para PC', 'Por conseguir', ['Tejo'], 1, 'Sin el adaptador el sensor no sirve'),
  i('Proyector cenital', 'Por relevar', ['Tejo', 'Karaoke'], 2),
  i('Cámara RGB', 'Por relevar', ['Baño'], 1),
  i('Lámina espejo bidireccional', 'Por conseguir', ['Baño'], 1),
  i('Monitor', 'Por conseguir', ['Booth', 'Cuadro'], 2),
  i('Auriculares cerrados', 'Confirmado', ['Booth'], 1),
  i('Tablet 10–11"', 'Confirmado', ['Rocola'], 1),
  i('Tira LED WS2812 + fuente', 'Por conseguir', ['Rocola'], 1),
  i('Micrófonos', 'Por relevar', ['Karaoke'], 3),
  i('ESP32 + RC522', 'Por conseguir', ['General'], 5),
  i('Tarjetas RFID', 'Por conseguir', ['General'], 6),
  i('Router prestado', 'Por relevar', ['General'], 1),
];

const estado = {
  bano: [
    t('Construir el rincón y plotear los biombos'),
    t('Maquetar la bacha'),
    t('Espejo: pantalla detrás de la lámina', 'Bloqueada'),
    t('Dispenser de souvenirs por gravedad'),
    t('Montar el baño en el aula', 'Por hacer', 'Instalación'),
  ],
  booth: [
    t('Guion del árbol entero', 'Hecha'),
    t('Generar y editar los videos de las ramas', 'Hecha'),
    t('Construir el box'),
    t('Electrónica: botones, sensor de asiento y lector'),
    t('Montar el booth en el aula', 'Por hacer', 'Instalación'),
  ],
  karaoke: [
    t('Armar el escenario de la esquina'),
    t('Soporte de la tablet'),
    t('App de elección de tema', 'Por hacer'),
    t('Corte sincronizado: base, letra y luces', 'Bloqueada'),
    t('Pedir los temas a los profesores', 'Hecha'),
    t('Pantalla de progreso mientras está bloqueado'),
  ],
  cuadro: [
    t('Construir el marco de ventana'),
    t('Producir los videos del equipo'),
    t('Decidir: clicker o gesto'),
    t('Montar el cuadro en el aula', 'Por hacer', 'Instalación'),
  ],
  tejo: [
    t('Campo de partículas y fuerza de la mano', 'Hecha'),
    t('Calibrar la mano'),
    t('Resolver cómo va la cámara'),
    t('Decidir cómo se gana el tejo'),
    t('Montar el tejo en el aula', 'Por hacer', 'Instalación'),
  ],
  rocola: [
    t('Estructura de la rocola', 'Hecha'),
    t('Vestirla con tela negra'),
    t('Stickers'),
    t('Tira LED: chispa y latido'),
    t('App de la tablet'),
    t('Instalar la rocola en el aula', 'Por hacer', 'Instalación'),
  ],
  barra: [
    t('Conseguir la mesa de la barra'),
    t('Vestir la barra'),
    t('Puesta a punto del bartender', 'Por hacer', 'Instalación'),
  ],
  general: [
    t('Diseñar los cartelitos de estación', 'Por hacer', 'Producción', 'Arts & crafts'),
    t('Menú: el mapa disfrazado de carta', 'Hecha', 'Producción', 'Arts & crafts'),
    t('Firmware único del ESP32 para las 5 estaciones', 'Por hacer', 'Producción', 'RFID'),
    t('Instalar el lector RFID — Tejo', 'Por hacer', 'Instalación', 'RFID'),
    t('Instalar el lector RFID — Cuadro', 'Por hacer', 'Instalación', 'RFID'),
    t('Telas oscuras en las paredes', 'Bloqueada', 'Instalación', 'Puesta en escena'),
    t('Murmullo de bar en loop', 'Por hacer', 'Producción', 'Sonido ambiente'),
  ],
};

const ESTACION = { barra: 'Trago', bano: 'Baño', booth: 'Booth', karaoke: 'Karaoke', cuadro: 'Cuadro', tejo: 'Tejo', rocola: 'Rocola', general: 'General' };

export function demoEstado() {
  const estaciones = {};
  for (const [clave, tareas] of Object.entries(estado)) {
    estaciones[clave] = { tareas: tareas.map((x) => ({ ...x })), inventario: inventario.filter((x) => x.estaciones.includes(ESTACION[clave])) };
  }
  return { leido: new Date().toISOString(), demo: true, estaciones };
}

export function demoTildar(tareaId, hecha) {
  const tarea = Object.values(estado).flat().find((x) => x.id === tareaId);
  if (!tarea) throw Object.assign(new Error('Esa tarea no es de ninguna estación'), { status: 403 });
  if (tarea.estado === 'Bloqueada') throw Object.assign(new Error('Está Bloqueada: eso se cambia en Notion'), { status: 409 });
  tarea.estado = hecha ? 'Hecha' : 'Por hacer';
  return { id: tareaId, estado: tarea.estado };
}
