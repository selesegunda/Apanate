// ¡Apáñate! · Primera integración experimental de agendas oficiales.
// Se descartan eventos sin fecha futura, localidad, enlace oficial y gratuidad explícita.
const MADRID = 'https://datos.madrid.es/id/id/dataset/300107-0-agenda-actividades-eventos/resource/300107-5-agenda-actividades-eventos-json/download/300107-5-agenda-actividades-eventos-json.json';
const JCYL = 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/eventos-de-la-agenda-cultural-categorizados-y-geolocalizados/records?limit=100&offset=0';
const normalize = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const clean = v => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 350);
const text = (obj, keys) => keys.map(k => obj?.[k]).find(v => v !== undefined && v !== null && v !== '') ?? '';
const dateOnly = value => {
  if (!value) return '';
  const s = String(value);
  const iso = s.match(/(20\d\d)-(\d\d)-(\d\d)/);
  if (iso) return iso[0];
  const es = s.match(/^(\d{2})\/(\d{2})\/(20\d{2})/);
  return es ? `${es[3]}-${es[2]}-${es[1]}` : '';
};
const safeURL = value => { try { const u=new URL(String(value));return u.protocol==='https:' ? u.href : ''; } catch { return ''; } };
const validDate = (d,from,to) => /^20\d\d-\d\d-\d\d$/.test(d) && d>=from && d<=to;
const hasFree = v => {
  if (v === true || v === 1 || v === '1') return true;
  if (typeof v === 'string') return /^(si|sí|true|gratis|gratuito|gratuita|free)$/i.test(v.trim());
  return false;
};
const freeByText = s => /\b(entrada gratuita|acceso gratuito|actividad gratuita|entrada libre|acceso libre|gratuito para todos|gratuita para todos|participaci[oó]n gratuita)\b/i.test(String(s||'')) && !/\b(no gratuita|no gratuito|de pago|precio de entrada|entrada desde)\b/i.test(String(s||''));
const kindOf = s => {
  const t=normalize(s);
  if (/feria|mercadillo/.test(t)) return 'ferias';
  if (/fiesta popular|fiestas patronales|verbena/.test(t)) return 'fiestas';
  if (/infantil|niños|ninos|familia|cuentacuentos/.test(t)) return 'familia';
  return 'cultura';
};
async function fetchJSON(url,ctx) {
  const controller=new AbortController(); const stop=setTimeout(()=>controller.abort(),7500);
  try { const r=await fetch(url,{signal:controller.signal,headers:{'accept':'application/json','user-agent':'Apanate/1.0 (+https://apanate.pages.dev/)'},cf:{cacheTtl:900,cacheEverything:true}}); if(!r.ok)throw Error(String(r.status)); return await r.json(); }
  finally {clearTimeout(stop);}
}
function madridEvents(data,from,to) {
  const list=Array.isArray(data?.['@graph'])?data['@graph']:Array.isArray(data)?data:Array.isArray(data?.result?.records)?data.result.records:[];
  const result=[];
  for(const e of list){
    const free=text(e,['free','gratuito','GRATUITO','gratuita','GRATUITA']);
    if(!hasFree(free)) continue;
    const start=dateOnly(text(e,['dtstart','fechaInicio','FECHA-INICIO','fecha_inicio','fecha']));
    if(!validDate(start,from,to))continue;
    const location=e.location||{};
    const address=location.address||{};
    const city=clean(typeof address==='object'?text(address,['addressLocality','locality','city']):'')||'Madrid';
    if(normalize(city)!=='madrid')continue;
    const place=clean(text(location,['title','name'])||text(address,['street-address','streetAddress'])||'Madrid');
    const url=safeURL(text(e,['link','url','@id','enlace']));if(!url)continue;
    const title=clean(text(e,['title','titulo','name']));if(!title)continue;
    result.push({title,city:'Madrid',province:'Madrid',place,start,kind:kindOf([title,text(e,['event-location','type','description'])].join(' ')),url,source:'Ayuntamiento de Madrid · Datos abiertos'});
  }
  return result;
}
function jcylEvents(data,from,to){
  const list=Array.isArray(data?.results)?data.results:[];const out=[];
  for(const r of list){
    const e=r.fields||r;
    const title=clean(text(e,['titulo','title','nombre','denominacion','nombre_evento']));
    const date=dateOnly(text(e,['fecha_inicio','fechainicio','fecha','fecha_evento','inicio','fecha_de_inicio']));
    const city=clean(text(e,['municipio','localidad','poblacion','nombre_municipio','municipio_nombre']));
    const province=clean(text(e,['provincia','nombre_provincia']));
    const url=safeURL(text(e,['enlace_contenido','url','enlace','web','enlace_evento']));
    const description=clean(text(e,['descripcion','description','observaciones','precio','tarifa','gratuito','entrada']));
    const price=text(e,['gratuito','gratis','es_gratuito','precio']);
    if(!title||!city||!date||!url||!validDate(date,from,to))continue;
    if(!hasFree(price) && !freeByText(description))continue;
    out.push({title,city,province,place:clean(text(e,['lugar','lugar_celebracion','direccion','nombre_lugar']))||city,start:date,kind:kindOf(title+' '+text(e,['categoria','tipo_evento'])),url,source:'Junta de Castilla y León · Agenda cultural'});
  }return out;
}
function respond(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=300, s-maxage=900','access-control-allow-origin':'*','x-content-type-options':'nosniff'}});}
export async function onRequestGet({request}){
  const q=new URL(request.url).searchParams;
  const city=clean(q.get('city')).slice(0,80),province=clean(q.get('province')).slice(0,80);
  const from=q.get('from')||'',to=q.get('to')||'';
  if(!city||!/^20\d\d-\d\d-\d\d$/.test(from)||!/^20\d\d-\d\d-\d\d$/.test(to)||to<from||((Date.parse(to)-Date.parse(from))/864e5)>45)return respond({events:[],notice:'Consulta no válida.'},400);
  let jobs=[];const cn=normalize(city),pn=normalize(province);
  if(cn==='madrid'||pn==='madrid')jobs.push(['Madrid',MADRID,madridEvents]);
  const regions=['avila','burgos','leon','palencia','salamanca','segovia','soria','valladolid','zamora'];
  if(regions.includes(pn)||regions.includes(cn))jobs.push(['Castilla y León',JCYL,jcylEvents]);
  if(jobs.length===0)return respond({events:[],sources:[],notice:'Esta localidad aún no tiene una fuente automática conectada. Estamos ampliando la cobertura.',failed:false});
  const settled=await Promise.all(jobs.map(async ([name,url,fn])=>{try{return {name,events:fn(await fetchJSON(url),from,to),ok:true}}catch{return {name,events:[],ok:false}}}));
  const all=settled.flatMap(s=>s.events);
  const key = e => normalize(e.title)+'|'+e.start+'|'+normalize(e.city);
  const dedup=[...new Map(all.map(e=>[key(e),e])).values()];
  const filtered=dedup.filter(e=>{const c=normalize(e.city),p=normalize(e.province);return c===cn||(pn&&(p===pn&&cn===pn));}).sort((a,b)=>a.start.localeCompare(b.start)).slice(0,60);
  return respond({events:filtered,sources:settled.filter(s=>s.ok).map(s=>s.name),failed:settled.every(s=>!s.ok),notice:settled.some(s=>!s.ok)?'Alguna fuente no respondió.':''});
}
