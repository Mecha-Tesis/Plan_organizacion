// POST /api/tildar — { id, hecha } con la clave del equipo en el encabezado X-Mecha-Clave.
import { tildar, claveCorrecta, responderError } from './_notion.js';

const ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });
  try {
    if (!claveCorrecta(req.headers['x-mecha-clave'])) {
      return res.status(401).json({ error: 'La clave no es esa', codigo: 'clave' });
    }
    const { id, hecha } = req.body ?? {};
    if (!ID.test(String(id)) || typeof hecha !== 'boolean') {
      return res.status(400).json({ error: 'Falta la tarea o si va hecha' });
    }
    res.status(200).json(await tildar(id, hecha));
  } catch (e) {
    responderError(res, e);
  }
}
