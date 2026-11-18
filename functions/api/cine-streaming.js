/**
 * ¡Apáñate! · Ranking diario de streaming en España.
 * Intenta leer el chart público de JustWatch y extraer los primeros títulos.
 * Si la estructura pública cambia, el front mantiene su copia de seguridad.
 */
const URL = 'https://www.justwatch.com/es/streaming-charts';

function clean(v='') {
  return String(v).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
}
function pickTitle(obj={}) {
  return obj.titulo || obj.title || obj.name || obj.fullPathTitle || obj.originalTitle || '';
}
function pickRank(obj={}) {
  return obj.puesto || obj.rank || obj.position || obj.currentRank || obj.chartRank || obj.place || null;
}
function pickMovement(obj={}) {
  for (const key of ['movimiento','movement','delta','change','rankDifference','trendDifference']) {
    const v = obj[key];
    if (Number.isFinite(v)) return Number(v);
  }
  return null;
}
function collectObjects(value, out=[]) {
  if (!value || typeof value !== 'object') return out;
  if (Array.isArray(value)) { for (const item of value) collectObjects(item, out); return out; }
  const title = pickTitle(value), rank = pickRank(value);
  if (title && Number.isFinite(Number(rank)) && Number(rank) > 0 && Number(rank) < 100) out.push(value);
  for (const v of Object.values(value)) collectObjects(v, out);
  return out;
}
function extractFromNextData(html) {
  const m = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return [];
  try { return collectObjects(JSON.parse(m[1])); } catch { return []; }
}
function extractJsonBlobs(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { out.push(...collectObjects(JSON.parse(m[1]))); } catch {}
  }
  return out;
}
function normalizeItem(obj, seen) {
  const titulo = clean(pickTitle(obj));
  const puesto = Number(pickRank(obj));
  if (!titulo || !Number.isFinite(puesto)) return null;
  const id = `${puesto}|${titulo.toLowerCase()}`;
  if (seen.has(id)) return null;
  seen.add(id);
  let donde = '';
  if (Array.isArray(obj.offers)) {
    donde = obj.offers.map(x => x.package?.shortName || x.package?.clearName || x.package?.name).filter(Boolean).slice(0,4).join(' · ');
  }
  if (!donde && Array.isArray(obj.packages)) {
    donde = obj.packages.map(x => x.shortName || x.clearName || x.name).filter(Boolean).slice(0,4).join(' · ');
  }
  return {
    puesto,
    titulo,
    movimiento: pickMovement(obj),
    donde: donde || 'Consulta plataformas y disponibilidad',
    enlace: URL
  };
}

export async function onRequestGet() {
  try {
    const res = await fetch(URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ApanateBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(12000),
      cf: { cacheTtl: 21600, cacheEverything: true }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();
    const seen = new Set();
    const raw = [...extractFromNextData(html), ...extractJsonBlobs(html)];
    const streaming = raw
      .map(obj => normalizeItem(obj, seen))
      .filter(Boolean)
      .sort((a,b) => a.puesto - b.puesto)
      .slice(0, 12);
    if (!streaming.length) throw new Error('Sin ranking reconocible');
    return new Response(JSON.stringify({
      fuente: 'JustWatch',
      fecha: new Date().toISOString(),
      total: streaming.length,
      streaming
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'No se pudo actualizar el ranking en directo' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}
