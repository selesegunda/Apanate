// ¡Apáñate! Agenda local: fuentes públicas y gratuitas verificadas.
// No inventar actividades ni interpretar "precio no indicado" como "gratis".
const SOURCES = {
  madrid: [
    {name:'Ayuntamiento de Madrid · Agenda', url:'https://datos.madrid.es/id/id/dataset/300107-0-agenda-actividades-eventos/resource/300107-5-agenda-actividades-eventos-json/download/300107-5-agenda-actividades-eventos-json.json',parser:'madrid'},
    {name:'Ayuntamiento de Madrid · Centros culturales', url:'https://datos.madrid.es/dataset/206974-0-agenda-eventos-culturales-100/resource/206974-0-agenda-eventos-culturales-100-json/download/206974-0-agenda-eventos-culturales-100.json',parser:'madrid'}
  ],
  cyl:[{name:'Junta de Castilla y León · Agenda cultural',url:'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/eventos-de-la-agenda-cultural-categorizados-y-geolocalizados/records?limit=100&offset=0',parser:'generic'}],
  andalucia:[{name:'Junta de Andalucía · Agenda',url:'https://datos.juntadeandalucia.es/api/v0/schedule/all?format=json',parser:'generic'}],
  canarias:[{name:'Gobierno de Canarias · Agenda cultural',url:'https://datos.canarias.es/catalogos/general/dataset/11dc9d88-b456-4ae2-bcf9-07ad624fd025/resource/d179079c-a2ed-40dc-a748-7b64d093c342/download/agendaproxima.csv',parser:'csv'}],
  euskadi:[{name:'Gobierno Vasco · Kulturklik',url:'https://opendata.euskadi.eus/contenidos/ds_eventos/agenda_cultura_euskadi/es_kultura/adjuntos/kulturklik.geojson',parser:'generic'}]
};
const regions={
  cyl:'Ávila|Burgos|León|Palencia|Salamanca|Segovia|Soria|Valladolid|Zamora',
  andalucia:'Almería|Cádiz|Córdoba|Granada|Huelva|Jaén|Málaga|Sevilla',
  canarias:'Las Palmas|Santa Cruz de Tenerife',
  euskadi:'Álava|Bizkaia|Gipuzkoa'
};
const OFFICIAL_AGENDAS={
 Asturias:['Turismo de Asturias · Agenda de Asturias','https://www.turismoasturias.es/agenda-de-asturias/'],
 'Illes Balears':['Govern de les Illes Balears · Cultura','https://www.caib.es/'],
 Ceuta:['Ciudad Autónoma de Ceuta · Agenda cultural','https://viveceuta.es/'],
 Melilla:['Ciudad Autónoma de Melilla · Cultura','https://culturamelilla.es/'],
 Madrid:['Ayuntamiento de Madrid · Agenda oficial','https://www.madrid.es/'],
 'A Coruña':['Xunta de Galicia · Agenda cultural','https://www.cultura.gal/gl/axenda'],Lugo:['Xunta de Galicia · Agenda cultural','https://www.cultura.gal/gl/axenda'],Ourense:['Xunta de Galicia · Agenda cultural','https://www.cultura.gal/gl/axenda'],Pontevedra:['Xunta de Galicia · Agenda cultural','https://www.cultura.gal/gl/axenda']
};
const norm = x => String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const tidy = x => String(x??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,350);
const field = (o, names) => {for(const n of names){let v=o?.[n]; if(v !== undefined && v !== null && v !== '')return v;}return '';};
const safeUrl=x=>{try{const u=new URL(String(x));return u.protocol==='https:'?u.href:''}catch{return ''}};
const dateOf=x=>{
 if(!x)return '';
 if(typeof x==='object')return dateOf(field(x,['startDate','date','fecha','value','start']));
 let s=String(x),m=s.match(/(20\d\d)-(\d\d)-(\d\d)/);if(m)return m[0];
 m=s.match(/^(\d\d)[\/\-](\d\d)[\/\-](20\d\d)/);return m?`${m[3]}-${m[2]}-${m[1]}`:'';
};
const explicitFree = x => x===true || x===1 || typeof x==='string'&&/^(1|si|sí|true|gratuito|gratuita|gratis|free|0\s*(?:€|euros))$/i.test(x.trim());
const freeText = s => /(?:entrada|acceso|actividad|participaci[oó]n|inscripci[oó]n)\s+(?:totalmente\s+)?(?:libre|gratuita?|sin coste)|gratuita?\s+(?:para todo el p[uú]blico|hasta completar aforo)/i.test(s) && !/(?:no\s+gratuita?|de pago|precio\s+de entrada)/i.test(s);
const kindOf=s=>{s=norm(s);if(/feria|mercadillo|mercado artesanal/.test(s))return 'ferias';if(/fiesta popular|fiestas patronales|verbena|romer[ií]a/.test(s))return 'fiestas';if(/infantil|familia|cuentacuentos|ninos|niños/.test(s))return 'familia';return 'cultura'};
const listFrom=raw=>Array.isArray(raw)?raw:Array.isArray(raw?.['@graph'])?raw['@graph']:Array.isArray(raw?.results)?raw.results:Array.isArray(raw?.features)?raw.features:Array.isArray(raw?.items)?raw.items:Array.isArray(raw?.data)?raw.data:Array.isArray(raw?.events)?raw.events:Array.isArray(raw?.records)?raw.records:[];
function parseEvents(raw,from,to,source,province,parser){
 const results=[];
 for(const item of listFrom(raw)){
   const e=item.fields||item.properties||item;
   const title=tidy(field(e,['title','titulo','TITULO','TITULO-ACTIVIDAD','name','nombre','denominacion','nombre_evento','titulo_es']));
   const date=dateOf(field(e,['dtstart','DTSTART','fechaInicio','FECHA-INICIO','fecha_inicio','fechainicio','startDate','start_date','start','date','fecha','fecha_evento','inicio']));
   const rawFree=field(e,['free','gratuito','GRATUITO','gratuita','GRATUITA','gratis','es_gratuito','freeAdmission']);
   const description=tidy(field(e,['description','descripcion','DESCRIPCION','texto','observaciones','condiciones','precio','tarifa','entrada']));
   if(!explicitFree(rawFree)&&!freeText(description))continue;
   if(!title||!date||date<from||date>to)continue;
   const location=e.location||e.ubicacion||{};
   const address=location.address||e.address||{};
   let city=tidy(field(e,['municipio','localidad','poblacion','nombre_municipio','municipio_nombre','city','CITY','ciudad','poblacion_nombre'])||field(address,['addressLocality','locality','city'])||field(location,['city','municipio']));
   let prov=tidy(field(e,['provincia','nombre_provincia','province','PROVINCIA'])||field(address,['addressRegion','province']));
   // Madrid city feeds carry no province; their scope is explicitly municipal.
   if(parser==='madrid'){city='Madrid';prov='Madrid'}
   if(!city)continue;
   // Some regional datasets include an agency name but no usable municipality.
   if(prov && norm(prov)!==norm(province))continue;
   if(!prov){if(parser==='madrid')prov='Madrid';else continue}
   const place=tidy(field(e,['lugar','lugar_celebracion','direccion','nombre_lugar','lugar_de_celebracion','event-location'])||field(location,['title','name'])||field(address,['street-address','streetAddress']));
   const url=safeUrl(field(e,['link','url','enlace','enlace_contenido','url_actividad','enlace_evento','web','URL','@id'])||field(e,['id']));
   // Require a direct event link, not a catalogue home or search URL.
   if(!url)continue;
   results.push({title,city,province:prov,place:place||city,start:date,kind:kindOf(title+' '+description),url,source,freeType:'explicit'});
 }
 return results;
}
function parseCSV(input){
 const src=input.replace(/^\uFEFF/,'');let rows=[],row=[],cell='',quoted=false;
 for(let i=0;i<src.length;i++){let c=src[i];if(c==='"'){if(quoted&&src[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(!quoted&&(c===';'||c===',')){row.push(cell);cell=''}else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&src[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}else cell+=c}
 if(cell||row.length){row.push(cell);rows.push(row)}
 const headers=(rows.shift()||[]).map(h=>h.trim());
 return rows.slice(0,3000).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));
}
async function fetchFeed(job){
 const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),10000);
 try{const r=await fetch(job.url,{signal:ctrl.signal,headers:{accept:job.parser==='csv'?'text/csv, text/plain, */*':'application/json, */*'},cf:{cacheTtl:1800,cacheEverything:true}});
 if(!r.ok)throw Error(String(r.status));
 return job.parser==='csv'?parseCSV(await r.text()):await r.json();
 }finally{clearTimeout(t)}
}
function response(obj,status=200){return new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=300, s-maxage=900','x-content-type-options':'nosniff'}})}
export async function onRequestGet({request}){
 const q=new URL(request.url).searchParams;
 const province=tidy(q.get('province')).slice(0,80),city=tidy(q.get('city')).slice(0,80);
 const from=q.get('from')||'',to=q.get('to')||'';
 if(!province||!/^20\d\d-\d\d-\d\d$/.test(from)||!/^20\d\d-\d\d-\d\d$/.test(to)||to<from||(Date.parse(to)-Date.parse(from))/864e5>45)return response({events:[],notice:'Selecciona provincia y fechas válidas.'},400);
 let group=norm(province)==='madrid'?'madrid':Object.keys(regions).find(k=>regions[k].split('|').some(p=>norm(p)===norm(province)));
 const jobs=SOURCES[group]||[];
 const fallback=OFFICIAL_AGENDAS[province]|| (group==='andalucia'?['Junta de Andalucía · Agenda oficial','https://www.juntadeandalucia.es/']:group==='cyl'?['Junta de Castilla y León · Cultura','https://cultura.jcyl.es/']:group==='canarias'?['Gobierno de Canarias · Cultura','https://www.gobiernodecanarias.org/cultura/']:group==='euskadi'?['Gobierno Vasco · Kulturklik','https://www.kulturklik.euskadi.eus/']:null);
 const officialAgenda=fallback?{name:fallback[0],url:fallback[1]}:null;
 if(!jobs.length)return response({events:[],sources:[],failed:false,officialAgenda,notice:'Todavía no hemos conectado una fuente automática verificable de actividades gratis para esta provincia.'});
 const settled=await Promise.all(jobs.map(async j=>{try{const raw=await fetchFeed(j);return {name:j.name,ok:true,events:parseEvents(raw,from,to,j.name,province,j.parser)}}catch(_){return {name:j.name,ok:false,events:[]}}}));
 const unique=new Map();for(const e of settled.flatMap(x=>x.events)){if(norm(e.province)!==norm(province))continue;const id=norm(e.title)+'|'+e.start+'|'+norm(e.city);if(!unique.has(id))unique.set(id,e)}
 const events=[...unique.values()].sort((a,b)=>a.start.localeCompare(b.start)||(norm(a.city)===norm(city)?-1:0)).slice(0,80);
 const failures=settled.filter(x=>!x.ok);
 return response({events,sources:settled.filter(x=>x.ok).map(x=>x.name),failed:failures.length===settled.length,officialAgenda,notice:failures.length?`${failures.length} fuente(s) oficiales sin respuesta. No se muestran actividades no verificadas.`:events.length?'':'En estas fuentes no hay actividades con gratuidad explícita para las fechas seleccionadas; no significa que la provincia no tenga planes.'});
}
