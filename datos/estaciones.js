// Lo fijo de cada estación. Lo vivo (tareas e inventario) sale de Notion.
// Lo usan la página (app.js) y las funciones de Vercel (api/), así que es la única copia.
//
// Mientras la tarea 01 no cierre, todo dice confirmado: false y la web lo marca "a confirmar".
// Cuando cierre, esto se regenera desde rules/estaciones/ del repo Tesis-bar.
//
// Posiciones: la planta del documento fuente, en centímetros (el aula mide 600 × 600).

export const MUESTRA = '2026-12-20';
export const ACTUALIZADO = '2026-10-15';

export const ESTACIONES = [
  {
    id: 'bano',
    nombre: 'Baño',
    titulo: 'Agua, por favor',
    tipo: 'mozo',
    zona: { x: 14, y: 20, w: 184, h: 189 },
    que: 'Un rincón cerrado con bacha y un espejo que te devuelve la cara mareada. Al salir, un dispenser larga un souvenir.',
    quien: ['A confirmar'],
    ultimo: 'Sin novedades desde agosto.',
    confirmado: false,
    notion: { base: '2924b024-d1df-4859-a6a8-c42c95699b79', fuente: 'e87b6aa1-be4f-4480-af9a-c50f6da723d6' },
    inventario: 'Baño',
  },
  {
    id: 'booth',
    nombre: 'Booth',
    titulo: 'A ciegas',
    tipo: 'mozo',
    zona: { x: 232, y: 20, w: 150, h: 137 },
    que: 'Un box para uno. Alguien en la pantalla te habla por auriculares y elegís con botones cómo sigue la charla.',
    quien: ['Un amigo de Ana (guion y videos)'],
    ultimo: 'Hecho: guion, videos, todo. Lo lleva un amigo.',
    confirmado: false,
    notion: { base: 'a506f737-3ebb-4c79-9488-9f7616108761', fuente: '739cfa3c-33ab-4b3b-aacf-09de28cadb74' },
    inventario: 'Booth',
  },
  {
    id: 'karaoke',
    nombre: 'Karaoke',
    titulo: 'La despedida',
    tipo: 'final',
    zona: { x: 402, y: 20, w: 184, h: 144 },
    que: 'Bloqueado toda la noche. Cuando las tres tarjetas pasaron por las cinco estaciones, se enciende el escenario. Cantan, se corta todo, vuelve.',
    quien: ['Luqui (código)'],
    ultimo: 'El código lo hace Luqui.',
    confirmado: false,
    notion: { base: 'e1dd0dba-1be9-47f4-8a1b-a1d9e6c4750a', fuente: '94920ac7-c10e-483d-a8fe-373c3033df41' },
    inventario: 'Karaoke',
  },
  {
    id: 'cuadro',
    nombre: 'Cuadro',
    titulo: 'Invita la casa',
    tipo: 'libre',
    zona: { x: 14, y: 259, w: 136, h: 136 },
    que: 'Una ventana colgada en la pared. Pasás slides con la mano y ves videos del equipo de MECHA.',
    quien: ['A confirmar'],
    ultimo: 'Sin novedades desde agosto.',
    confirmado: false,
    notion: { base: '8e0b46af-792b-4500-a78d-36d42b464849', fuente: 'f85ff8b9-0aa2-4287-991e-a6dea65bb9a0' },
    inventario: 'Cuadro',
  },
  {
    id: 'tejo',
    nombre: 'Tejo',
    titulo: 'Mano a mano',
    tipo: 'libre',
    zona: { x: 205, y: 245, w: 177, h: 225 },
    que: 'Sobre la mesa se proyecta un campo de partículas. Con la mano empujás una bola de luz que abre camino hasta la diana.',
    quien: ['A confirmar'],
    ultimo: 'Corre en tejo-table.html. Falta calibrar mejor la mano y resolver cómo va la cámara.',
    confirmado: false,
    notion: { base: 'fcce2de3-613a-47b9-af0f-b5b11ea5057c', fuente: '67f70e03-cfd4-4e8d-8cae-0ca1ce055f0f' },
    inventario: 'Tejo',
  },
  {
    id: 'barra',
    nombre: 'Barra',
    titulo: 'El trago invitado',
    tipo: 'lugar',
    zona: { x: 450, y: 232, w: 143, h: 204 },
    que: 'Un desconocido invita un trago y se brinda. Es un lugar, no una estación: sin pantalla ni tarjeta, y no cuenta para el karaoke.',
    quien: ['A confirmar'],
    ultimo: 'El chin chin con el yo del pasado se descartó: no se iba a ver bien.',
    confirmado: true,
    notion: null,
    inventario: null,
  },
  {
    id: 'rocola',
    nombre: 'Rocola',
    titulo: 'El clásico',
    tipo: 'libre',
    zona: { x: 395, y: 484, w: 144, h: 96 },
    que: 'Una rocola con una tablet adentro. Pasás la tarjeta, se enciende, elegís un tema y cambia la música de toda la sala.',
    quien: ['Luqui (código)'],
    ultimo: 'La estructura está hecha. Falta vestirla con tela negra, los stickers y la luz LED.',
    confirmado: false,
    notion: { base: 'e646c6d9-78cc-42a2-b6d8-33b1128c5cf1', fuente: 'd7cb74b6-1667-47ea-a2b6-54cbe8189876' },
    inventario: 'Rocola',
  },
];

// Lo que no tiene lugar en la planta: red, tarjetas, cartelitos, luces, la noche.
export const GENERAL = {
  id: 'general',
  nombre: 'General',
  que: 'Lo que atraviesa la noche entera: las tarjetas, la red, los cartelitos, las luces, el sonido de la sala.',
  quien: ['A confirmar'],
  confirmado: false,
  notion: { base: '43a32e3a-04b1-4979-9503-d1ea1d860aa3', fuente: '183daf6c-d222-4270-b9a2-70b63ff8e305' },
  inventario: 'General',
};

// Lo que se dibuja en la planta pero no se toca.
export const LUGARES = [
  { id: 'mesa', nombre: 'Mesa', titulo: 'recibimiento', zona: { x: 27, y: 484, w: 178, h: 96 } },
];

// La entrada: un hueco en la pared de abajo, en centímetros.
export const ENTRADA = { desde: 252, hasta: 355 };

export const INVENTARIO = { base: 'f71e1e6d-a5ea-4c0c-a421-fe6cc372448e', fuente: 'aee665dc-dd83-4e69-8bc4-c070331d775c' };
