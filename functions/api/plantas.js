// Cloudflare Pages Function: /api/plantas
// Binding KV: PLANTAS_KV. Secret: TREFLE_TOKEN.
const DAY = 86400;
const FRESH = 90 * DAY;
const RETAIN = 365 * DAY;
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
    'x-content-type-options': 'nosniff', 'access-control-allow-origin': '*' }
});
const clean = (v, max = 120) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const text = (v, max = 160) => typeof v === 'string' ? v.slice(0, max) : null;
function normalizeName(v) { return clean(v, 64).normalize('NFKC').toLowerCase().replace(/\s+/g, ' '); }
function mapSummary(x) {
  return { id: Number(x.id), slug: text(x.slug, 100), scientificName: text(x.scientific_name),
    commonName: text(x.common_name), family: text(x.family), genus: text(x.genus) };
}
function mapDetails(x) {
  const g = x.growth || {};
  const s = x.specifications || {};
  return { ...mapSummary(x), edible: typeof x.edible === 'boolean' ? x.edible : null,
    duration: Array.isArray(x.duration) ? x.duration.filter(y=>typeof y==='string').slice(0,4) : [],
    care: {
      light: Number.isFinite(Number(g.light)) && g.light !== null ? Number(g.light) : null,
      atmosphericHumidity: Number.isFinite(Number(g.atmospheric_humidity)) && g.atmospheric_humidity !== null ? Number(g.atmospheric_humidity) : null,
      minimumTemperatureC: typeof g.minimum_temperature?.deg_c === 'number' ? g.minimum_temperature.deg_c : null,
      maximumTemperatureC: typeof g.maximum_temperature?.deg_c === 'number' ? g.maximum_temperature.deg_c : null,
      soilPhMin: typeof g.ph_minimum === 'number' ? g.ph_minimum : null,
      soilPhMax: typeof g.ph_maximum === 'number' ? g.ph_maximum : null,
      soilTexture: typeof g.soil_texture === 'number' ? g.soil_texture : null,
      soilHumidity: typeof g.soil_humidity === 'number' ? g.soil_humidity : null,
      droughtTolerance: typeof g.drought_tolerance === 'string' ? g.drought_tolerance : null,
      frostTolerance: typeof g.frost_tolerance === 'string' ? g.frost_tolerance : null,
      growthMonths: Array.isArray(g.growth_months) ? g.growth_months.filter(Number.isInteger).slice(0,12) : [],
      averageHeightCm: typeof s.average_height?.cm === 'number' ? s.average_height.cm : null,
    },
    attribution: 'Datos botánicos: Trefle · CC BY 4.0. Consulta la fuente para detalles y licencias.' };
}
async function fetchTrefle(path, token) {
  const url = new URL('https://trefle.io/api/v1/' + path);
  url.searchParams.set('token', token);
  const res = await fetch(url.toString(), { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(9000) });
  if (!res.ok) { const e = Error('API no disponible'); e.status = res.status; throw e; }
  return res.json();
}
const age = obj => Date.now() - Date.parse(obj?.savedAt || 0);
async function readCache(kv, key) { try { return await kv.get(key, 'json'); } catch { return null; } }
async function putCache(kv, key, data) {
  if (!kv) return;
  try { await kv.put(key, JSON.stringify({ data, savedAt: new Date().toISOString() }), { expirationTtl: RETAIN }); } catch { /* límites KV: consulta responde igualmente */ }
}
export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const id = u.searchParams.get('id');
  const q = normalizeName(u.searchParams.get('q'));
  if (id !== null && !/^[a-z0-9][a-z0-9-]{0,99}$/.test(id)) return json({error:'Identificador no válido'},400);
  if (id === null && (q.length < 2 || q.length > 64)) return json({error:'Escribe entre 2 y 64 caracteres'},400);
  const key = id !== null ? 'plant:detail:' + id : 'plant:search:' + q;
  const kv = env.PLANTAS_KV;
  const cached = kv ? await readCache(kv, key) : null;
  if (cached && age(cached) < FRESH*1000) return json({ ...cached.data, cache:'compartida', updatedAt:cached.savedAt });
  if (!env.TREFLE_TOKEN) {
    if (cached) return json({...cached.data,cache:'antigua',updatedAt:cached.savedAt,notice:'Mostramos datos guardados: la fuente no está configurada.'});
    return json({error:'Falta configurar TREFLE_TOKEN en Cloudflare Pages.'},503);
  }
  try {
    let data;
    if (id !== null) {
      // Las fichas completas vienen en /species/:slug, con campos growth.
      const upstream = await fetchTrefle('species/' + encodeURIComponent(id), env.TREFLE_TOKEN);
      if (!upstream?.data?.scientific_name) throw Error('Ficha no disponible');
      data = { plant: mapDetails(upstream.data) };
    } else {
      const upstream = await fetchTrefle('plants/search?q=' + encodeURIComponent(q), env.TREFLE_TOKEN);
      const plants = Array.isArray(upstream.data) ? upstream.data.map(mapSummary).filter(p=>p.slug && p.scientificName).slice(0,20) : [];
      data = { plants, query:q, hasMore: Boolean(upstream.links?.next) };
    }
    await putCache(kv,key,data);
    return json({...data,cache:kv?'guardada':'sin-KV',updatedAt:new Date().toISOString()});
  } catch(e) {
    if (cached) return json({...cached.data,cache:'antigua',updatedAt:cached.savedAt,notice:'La fuente no responde. Mostramos una ficha anterior.'});
    if (e.status === 429) return json({error:'La fuente ha alcanzado su límite; inténtalo más tarde.'},503);
    return json({error:'No se pudieron obtener datos de Trefle. Las recomendaciones originales siguen disponibles.'},502);
  }
}
