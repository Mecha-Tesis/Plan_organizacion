// GET /api/estado — las tareas y el inventario de cada estación, leídos de Notion.
import { leerEstado, responderError } from './_notion.js';

export default async function handler(req, res) {
  try {
    const estado = await leerEstado();
    // Vercel lo guarda 20 s: así diez personas mirando no le pegan diez veces a Notion.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=20, stale-while-revalidate=40');
    res.status(200).json(estado);
  } catch (e) {
    responderError(res, e);
  }
}
