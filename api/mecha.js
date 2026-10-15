// /mecha.md y /mecha.json (ver vercel.json): todo junto, para que lo lea una IA.
import { leerEstado } from './_notion.js';
import { armarMecha, aMarkdown } from '../lib/mecha.js';

export default async function handler(req, res) {
  let vivo = null;
  let error = null;
  try {
    vivo = await leerEstado();
  } catch (e) {
    error = e.message; // Con Notion caído, lo fijo se sirve igual.
  }
  const mecha = armarMecha(vivo, error);
  res.setHeader('Cache-Control', error ? 'no-store' : 'public, max-age=0, s-maxage=20, stale-while-revalidate=40');
  if (req.query.formato === 'json') return res.status(200).json(mecha);
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.status(200).send(aMarkdown(mecha));
}
