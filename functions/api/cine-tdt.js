/**
 * ¡Apáñate! · Próximas películas en la TDT española.
 * Combina guías públicas en lugar de quedarse con la primera que responde.
 * Nunca rellena con emisiones pasadas, ni garantiza 12 películas.
 */
const EPG_URLS = [
  'https://epgshare01.online/epgshare01/epg_ripper_ES1.xml.gz',
  'https://www.tdtchannels.com/epg/TV.xml.gz',
  'https://raw.githubusercontent.com/raulfdeztdo/epg/main/guide.xml'
];

// Solo canales de TDT en abierto. Variantes de IDs: La.1.es, La1.TV, La 1 HD…
const CHANNELS = {
  la1: 'La 1', la2: 'La 2', antena3: 'Antena 3', telecinco: 'Telecinco',
  cuatro: 'Cuatro', lasexta: 'laSexta', fdf: 'FDF', bemad: 'Be Mad',
  neox: 'Neox', nova: 'Nova', atreseries: 'Atreseries', trece: 'TRECE',
  '13tv': 'TRECE', paramountnetwork: 'Paramount Network',
  dkiss: 'DKISS', dmax: 'DMAX', mega: 'Mega', energy: 'Energy',
  divinity: 'Divinity', ten: 'TEN', canalsur: 'Canal Sur',
  canalsur2: 'Canal Sur 2', tv3: 'TV3', '33': '33', apunt: 'À Punt',
  aragontv: 'Aragón TV', etb1: 'ETB 1', etb2: 'ETB 2', tvg: 'TVG',
  telemadrid: 'Telemadrid', laotra: 'La Otra', '7tv': '7TV',
  cmm: 'CMM', canalextremadura: 'Canal Extremadura',
  tpa: 'TPA', ib3: 'IB3', la7: 'La 7', cyltv: 'CyLTV',
  rtvc: 'RTVC', rtvccanarias: 'Televisión Canaria',
  '8tv': '8TV', bomcine: 'BOM Cine', bom: 'BOM Cine',
  cineverditv: 'Cine Verdi TV', castillalamancha: 'CMM',
  televisioncanaria: 'Televisión Canaria', canarias7: 'Canarias 7'
};

function normalizeChannel(input = '') {
  let n = String(input).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  n = n.replace(/\b(?:hdtv|fullhd|uhd|4k|hd|sd)\b/g, '');
  n = n.replace(/\((?:espana|spain|es|tv|hd)\)/g, '');
  n = n.replace(/\.(?:es|tv|com)$/g, '').replace(/[^a-z0-9]/g, '');
  return n;
}
function channelName(display, id) {
  for (const raw of [display, id]) {
    const key = normalizeChannel(raw);
    if (Object.prototype.hasOwnProperty.call(CHANNELS, key) && CHANNELS[key]) return CHANNELS[key];
  }
  return '';
}
function clean(s = '') {
  return String(s).replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}
function one(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? clean(m[1]) : '';
}
function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return m ? m[1] : '';
}
function xmltvDate(v) {
  const m = String(v).match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\s*([+-]\d{4})?/);
  if (!m || !m[7]) return NaN;
  const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  const sign = m[7][0] === '-' ? -1 : 1;
  const offset = sign * (+m[7].slice(1, 3) * 60 + +m[7].slice(3, 5));
  return utc - offset * 60000;
}
const MOVIE_CATEGORY = /(?:pel[ií]cula|largometraje|movie|movies|film|filme|cinema|cine|feature\s*film|tv\s*movie|fiction\s*film)/i;
const MOVIE_DESCRIPTION = /\b(?:pel[ií]cula\s+(?:de|dirigida|estadounidense|espa[nñ]ola|francesa|brit[aá]nica|alemana)|largometraje\s+(?:de|dirigido|estadounidense|espa[nñ]ol)|film\s+(?:dirigido|de\s+ficci[oó]n))\b/i;
const NEGATIVE_CATEGORY = /^(?:serie|series|documental|documentary|reality|noticias|informativos|telediario|magazine|deportes|sports|infantil|children|entretenimiento|entertainment|concurso|game show)$/i;

function readGuide(xml, now) {
  const names = new Map();
  for (const m of xml.matchAll(/<channel\b([^>]*)>([\s\S]*?)<\/channel>/gi)) {
    const id = attr(m[1], 'id');
    const displayNames = [...m[2].matchAll(/<display-name(?:\s[^>]*)?>([\s\S]*?)<\/display-name>/gi)]
      .map(v => clean(v[1]));
    const name = channelName(displayNames.find(v => channelName(v, id)) || displayNames[0] || '', id);
    if (id && name) names.set(id, name);
  }
  const results = [], until = now + 48 * 60 * 60 * 1000;
  for (const m of xml.matchAll(/<programme\b([^>]*)>([\s\S]*?)<\/programme>/gi)) {
    const canal = names.get(attr(m[1], 'channel'));
    if (!canal) continue;
    const ts = xmltvDate(attr(m[1], 'start'));
    if (!Number.isFinite(ts) || ts <= now || ts > until) continue;
    const body = m[2];
    const cats = [...body.matchAll(/<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi)].map(x => clean(x[1]));
    if (cats.some(c => NEGATIVE_CATEGORY.test(c))) continue;
    const desc = one(body, 'desc');
    if (!cats.some(c => MOVIE_CATEGORY.test(c)) && !MOVIE_DESCRIPTION.test(desc)) continue;
    const titulo = one(body, 'title');
    if (!titulo || /^(?:cine|pel[ií]cula|film|movie|cinema)$/i.test(titulo)) continue;
    results.push({
      titulo: titulo.slice(0, 170), canal, inicio: new Date(ts).toISOString(),
      genero: cats.find(c => MOVIE_CATEGORY.test(c)) || 'Película',
      fuente: 'https://www.formulatv.com/programacion/'
    });
  }
  return results;
}

function selectBalanced(items) {
  const seen = new Set(), count = new Map(), out = [];
  items.sort((a, b) => a.inicio.localeCompare(b.inicio));
  for (const p of items) {
    const key = `${p.canal}|${p.inicio}|${p.titulo.toLowerCase().trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const n = count.get(p.canal) || 0;
    if (n >= 2) continue;
    count.set(p.canal, n + 1);
    out.push(p);
    if (out.length >= 12) break;
  }
  return out;
}

async function loadGuide(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/xml,text/xml,*/*' },
    signal: AbortSignal.timeout(12000),
    cf: { cacheTtl: 900, cacheEverything: true }
  });
  if (!response.ok) throw new Error('EPG HTTP ' + response.status);
  // Some endpoints return gzip as an actual file (rather than Content-Encoding).
  // Decompress only when the body starts with gzip magic bytes.
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > 34 * 1024 * 1024) throw new Error('EPG demasiado grande');
  let xml;
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    if (typeof DecompressionStream === 'undefined') throw new Error('Gzip no soportado');
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    xml = await new Response(stream).text();
  } else {
    xml = new TextDecoder('utf-8').decode(bytes);
  }
  if (!xml.includes('<programme')) throw new Error('Guía sin programas');
  return xml;
}

export async function onRequestGet() {
  const now = Date.now();
  const all = [], usedSources = [];
  for (const url of EPG_URLS) {
    try {
      const xml = await loadGuide(url);
      const fresh = readGuide(xml, now);
      usedSources.push({ url, encontradas: fresh.length });
      all.push(...fresh);
      // First two sources complement each other: nationwide + autonomic TDT.
      // Third is a fallback if the first two don't provide enough variety.
      if (usedSources.length >= 2 && new Set(selectBalanced(all).map(x => x.canal)).size >= 6) break;
    } catch (_) { /* Next independently maintained guide */ }
  }
  const peliculas = selectBalanced(all);
  return new Response(JSON.stringify({
    peliculas, actualizado: new Date(now).toISOString(),
    canales: new Set(peliculas.map(p => p.canal)).size,
    fuentesConsultadas: usedSources.length
  }), {
    status: all.length || usedSources.length ? 200 : 503,
    headers: {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
  });
}
