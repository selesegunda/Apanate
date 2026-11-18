/** ¡Apáñate! · Agregador de planes gratuitos. Cloudflare Pages Function.
 * No infiere gratuidad de un recinto o del silencio del organizador.
 * Las tarjetas permanecen en nuestra web; solo el detalle incluye enlace al evento original.
 * Fuentes provinciales, autonómicas y municipales; las asociaciones de feriantes se incorporarán
 * únicamente cuando proporcionen fechas individualizadas y reutilizables, no páginas genéricas.
 */
const CYL='https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/eventos-de-la-agenda-cultural-categorizados-y-geolocalizados/records';
const SOURCE={
  madrid:[
    {name:'Madrid · Agenda municipal',parser:'madrid',urls:[
      // Distribuciones oficiales del mismo conjunto de datos. CSV primero:
      // la distribución JSON puede incluir caracteres de control mal escapados.
      'https://datos.madrid.es/dataset/300107-0-agenda-actividades-eventos/resource/300107-2-agenda-actividades-eventos-csv/download/300107-0-agenda-actividades-eventos.csv',
      'https://datos.madrid.es/dataset/300107-0-agenda-actividades-eventos/resource/300107-5-agenda-actividades-eventos-json/download/300107-0-agenda-actividades-eventos.json'
    ]},
    {name:'Madrid · Bibliotecas gratuitas',parser:'madrid-library',freeByDataset:true,urls:[
      'https://datos.madrid.es/dataset/206717-0-agenda-eventos-bibliotecas/resource/206717-1-agenda-eventos-bibliotecas-json/download/206717-0-agenda-eventos-bibliotecas.json',
      'https://datos.madrid.es/id/id/dataset/206717-0-agenda-eventos-bibliotecas/resource/206717-1-agenda-eventos-bibliotecas-json/download/206717-1-agenda-eventos-bibliotecas-json.json'
    ]}
  ],
  cyl:[0,100,200,300].map(offset=>({name:'Castilla y León · Cultura',url:`${CYL}?limit=100&offset=${offset}`,parser:'cyl'})),
  andalucia:[{name:'Andalucía · Agenda cultural',url:'https://datos.juntadeandalucia.es/api/v0/schedule/all?format=json',parser:'andalucia'}],
  canarias:[{name:'Canarias · Agenda cultural',url:'https://datos.canarias.es/catalogos/general/dataset/11dc9d88-b456-4ae2-bcf9-07ad624fd025/resource/d179079c-a2ed-40dc-a748-7b64d093c342/download/agendaproxima.csv',parser:'canarias',csv:true}],
  // API cultural de Euskadi publicada oficialmente, validación de gratuidad estricta.
  euskadi:[{name:'Euskadi · Agenda cultural',url:'https://opendata.euskadi.eus/contenidos/ds_eventos/agenda_cultura_euskadi/es_kultura/adjuntos/kulturklik.geojson',parser:'euskadi'}],
  zaragoza:[{name:'Zaragoza · Agenda municipal',url:'https://www.zaragoza.es/sede/servicio/cultura/evento/portal.json?rows=300',parser:'zaragoza'}],
  malaga:[{name:'Málaga · Agenda municipal',url:'https://datosabiertos.malaga.eu/recursos/cultura/agenda/2026.csv',parser:'malaga',csv:true}],
  gijon:[{name:'Gijón · Agenda municipal',url:'https://opendata.gijon.es/descargar.php?id=728&tipo=JSON',parser:'gijon'}]
};
const REGIONS={cyl:'Ávila|Burgos|León|Palencia|Salamanca|Segovia|Soria|Valladolid|Zamora',andalucia:'Almería|Cádiz|Córdoba|Granada|Huelva|Jaén|Málaga|Sevilla',canarias:'Las Palmas|Santa Cruz de Tenerife',euskadi:'Álava|Bizkaia|Gipuzkoa'};
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/<[^>]*>/g,' ').trim().toLowerCase();
const tidy=x=>{
 if(x===null||x===undefined)return '';
 if(Array.isArray(x))return tidy(x.map(tidy).filter(Boolean).join(', '));
 if(typeof x==='object'){
  for(const key of ['value','nombre','name','title','description','streetAddress','direccion','address','lugar','locality','addressLocality','city']){
   if(x[key]!==undefined&&x[key]!==x){const v=tidy(x[key]);if(v)return v;}
  }
  return '';
 }
 return String(x).replace(/<[^>]*>/g,' ').replace(/&nbsp;/ig,' ').replace(/&amp;/ig,'&').replace(/\s+/g,' ').trim().slice(0,750);
};
const get=(o,fields)=>{if(!o||typeof o!=='object')return '';for(const f of fields){let v=o[f];if(v!==undefined&&v!==null&&v!=='')return v;}return ''};
function secureLink(u){if(!u)return '';try{let s=String(u).trim();if(s.startsWith('http://') && /^http:\/\/(www\.madrid\.es|www\.zaragoza\.es|www\.gijon\.es|www\.cultura\.jcyl\.es)/.test(s))s='https://'+s.slice(7);let v=new URL(s);return v.protocol==='https:'?v.href:''}catch{return ''}}
function isoDate(x){if(!x)return '';if(typeof x==='object')return isoDate(get(x,['start','value','date','fecha']));let s=String(x),m=s.match(/(20\d\d)-(\d\d)-(\d\d)/);if(m)return m[0];m=s.match(/^(\d\d)[\/\-](\d\d)[\/\-](20\d\d)/);return m?`${m[3]}-${m[2]}-${m[1]}`:''}
// Clasificación conservadora: una ausencia de precio nunca se interpreta como gratuidad.
function priceSignal(value,asFlag=false){
 if(asFlag){
  if(value===true||value===1||/^(1|si|true|gratis|gratuito|gratuita)$/i.test(String(value??'').trim()))return 'free';
  if(value===false||value===0||/^(0|no|false)$/i.test(String(value??'').trim()))return 'paid';
  return 'unknown';
 }
 if(value===true)return 'free';if(value===false)return 'unknown';
 if(typeof value==='number')return value===0?'free':value>0?'paid':'unknown';
 const str=norm(value);if(!str)return 'unknown';
 if(/^(si|true|gratis|gratuito|gratuita|free|entrada libre|acceso libre|sin coste|0|0[.,]00\s*(?:€|euros)?)$/.test(str))return 'free';
 if(/^(no|false|de pago|pago|entrada de pago)$/.test(str))return 'paid';
 const amount=str.match(/^(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)$/);
 if(amount)return Number(amount[1].replace(',','.'))===0?'free':'paid';
 return 'unknown';
}
function classify(cost,description,title,asFlag=false){
 const full=norm(`${title} ${description}`), costStatus=priceSignal(cost,asFlag);
 const conditional=/(?:gratuit[ao]s?|gratis|entrada libre|acceso libre|sin coste)[^.;]{0,90}(?:para (?:menores|mayores|residentes|empadronados|jovenes|estudiantes|personas|ciudadan|familias|desempleados|miembros)|con (?:carnet|acreditacion|reserva)|solo (?:los|para|en)|excepto|hasta \d+ anos)|(?:residentes|empadronados|menores|mayores|jovenes|estudiantes|personas con discapacidad)[^.;]{0,80}(?:gratis|gratuit[ao]s?|entrada libre)/.test(full);
 const textFree=/(?:entrada|acceso|actividad|participacion|inscripcion|evento|visita|concierto|taller|espectaculo|asistencia|jornada)s?\s+(?:(?:totalmente|completamente)\s+)?(?:libre|gratuit[ao]s?|sin coste)|\bentrada\s+libre\b|\bacceso\s+libre\b|\bsin\s+coste\b|\bgratuit[ao]s?\b|\bgratis\b/.test(full);
 const paidText=/(?:\bde pago\b|\bentrada[s]?\s+(?:de pago|desde \d+)|\bprecio\s*[:=]\s*[1-9]\d*|\btarifa\s*[:=]\s*[1-9]\d*|\bno\s+(?:es\s+)?gratuit[ao])/.test(full);
 // Cuando aparecen señales contradictorias, no anunciamos una entrada gratuita.
 if((costStatus==='paid'&&(textFree||conditional))||(paidText&&(costStatus==='free'||textFree)))return 'pendiente';
 if(conditional && (textFree||costStatus==='free'))return 'condicional';
 if(costStatus==='free'||(textFree&&!paidText))return 'gratis';
 if(costStatus==='paid'||paidText)return 'pago';
 return 'pendiente';
}
// Las categorías no son excluyentes: un cuentacuentos es cultura Y familia.
function kindsFor(title,description,category){
 const s=norm([title,description,category].join(' '));
 const kinds=[];
 if(/\b(feria|ferias|ferial|mercadillo|mercado artesanal|mercado medieval)\b/.test(s))kinds.push('ferias');
 if(/\b(fiesta patronal|fiestas patronales|romeria|verbena|fiesta popular|fiestas populares|carnaval|cabalgata|verbenas)\b/.test(s))kinds.push('fiestas');
 const family=/\b(familia|familiar|familias|infantil|infancia|cuentacuentos|ninos|ninas|peques|bebes|juvenil)\b/.test(s);
 if(family)kinds.push('familia');
 // Cultura es una categoría amplia, también para propuestas familiares culturales.
 if(!kinds.includes('ferias')&&!kinds.includes('fiestas')||/teatro|musica|concierto|danza|libro|lectura|biblioteca|cuento|exposicion|taller|cine|cultura|poesia|literatura|visita guiada/.test(s))kinds.push('cultura');
 return [...new Set(kinds.length?kinds:['cultura'])];
}
const kind=s=>kindsFor(s,'','')[0];
function records(raw){if(Array.isArray(raw))return raw;for(const k of ['@graph','results','result','records','features','events','items','data','listado'])if(Array.isArray(raw?.[k]))return raw[k];if(Array.isArray(raw?.result?.records))return raw.result.records;if(Array.isArray(raw?.response?.docs))return raw.response.docs;return []}
function rowsFromCSV(txt){const first=(txt.replace(/^\uFEFF/,'').split(/\r?\n/)[0]||'');const sep=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';let arr=[],row=[],value='',quoted=false;for(let i=0;i<txt.length;i++){const c=txt[i];if(c==='"'){if(quoted&&txt[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(c===sep&&!quoted){row.push(value);value=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&txt[i+1]==='\n')i++;row.push(value);if(row.some(v=>v.trim()))arr.push(row);row=[];value=''}else value+=c}row.push(value);if(row.some(v=>v.trim()))arr.push(row);const names=(arr.shift()||[]).map(x=>x.trim().replace(/^\uFEFF/,''));return arr.slice(0,5000).map(r=>Object.fromEntries(names.map((n,i)=>[n,r[i]||''])))}
const MAPPING={
 title:['TITULO','TITULO-ACTIVIDAD','titulo','title','nombre','name','denominacion','nombre_evento','titulo_es','nombreActividad'],
 begin:['FECHA','fecha_inicio','Fecha de inicio','dtstart','DTSTART','fechaInicio','FECHA-INICIO','fechainicio','startDate','date','fecha','inicio','start','fechas'],
 end:['FECHA-FIN','fecha_fin','Fecha de fin','endDate','end','fechaFin'],
 cost:['GRATUITO','gratuito','GRATUITA','free','gratis','gratuita','es_gratuito','freeAdmission','precio','PRECIO','Precio','tarifa'],
 description:['DESCRIPCION','descripcion','description','texto','observaciones','condiciones','detalle','contenido','resumen','entradilla'],
 city:['nombre_localidad','Nombre Localidad','localidad','LOCALIDAD','municipio','poblacion','nombre_municipio','city','ciudad','municipality','poblacion_nombre'],
 province:['nombre_provincia','Nombre Provincia','provincia','PROVINCIA','province','comarca_provincia'],
 place:['lugar_celebracion','Lugar de celebración','NOMBRE-INSTALACION','nombre_instalacion','lugar','lugar_de_celebracion','address','direccion','ubicacion','nombre_lugar'],
 url:['CONTENT-URL','URL-ACTIVIDAD','content-url','url_actividad','enlace_al_contenido','Enlace al contenido','enlace_evento','url','link','enlace','web','id_url','url_evento','@id'],
 time:['HORA','hora_inicio','Hora inicio','hora','time']
};
// Diagnóstico por etapa. Los registros se cuentan ANTES de eliminarse del catálogo público.
function parse(raw,from,to,source,province,parser,diagnostic){
 const out=[];const all=records(raw);
 const d=diagnostic||{received:0,missingTitle:0,missingDate:0,outOfRange:0,missingPlace:0,wrongProvince:0,missingLink:0,accepted:0,classified:{gratis:0,condicional:0,pendiente:0,pago:0}};
 d.received=all.length;
 for(const obj of all){
  const e=obj.fields||obj.properties||obj;
  const title=tidy(get(e,MAPPING.title));if(!title){d.missingTitle++;continue;}
  const begin=isoDate(get(e,MAPPING.begin)),end=isoDate(get(e,MAPPING.end));
  if(!begin){d.missingDate++;continue;}
  if(begin>to||(end||begin)<from){d.outOfRange++;continue;}
  let location=e.location||e.ubicacion||{};if(Array.isArray(location))location=location[0]||{};
  const address=location.address||{};
  let city=tidy(get(e,MAPPING.city)||get(location,['name','locality','city','municipio'])||get(address,['addressLocality','city']));
  let prov=tidy(get(e,MAPPING.province)||get(address,['addressRegion','province']));
  const assumed={madrid:['Madrid','Madrid'],'madrid-library':['Madrid','Madrid'],zaragoza:['Zaragoza','Zaragoza'],malaga:['Málaga','Málaga'],gijon:['Gijón','Asturias']};
  if(assumed[parser]){city=city||assumed[parser][0];prov=prov||assumed[parser][1];}
  if(!prov&&parser==='cyl')prov=tidy(get(e,['nombreprovincia','nombreProvincia','provincia_nombre']));
  if(!city||!prov){d.missingPlace++;continue;}
  if(norm(prov)!==norm(province)){d.wrongProvince++;continue;}
  const desc=tidy(get(e,MAPPING.description));
  const hasFlag=['GRATUITO','gratuito','GRATUITA','gratis','gratuita','es_gratuito','freeAdmission','free'].find(k=>Object.prototype.hasOwnProperty.call(e,k)&&e[k]!==''&&e[k]!==null);
  let price=hasFlag?e[hasFlag]:get(e,['precio','PRECIO','Precio','tarifa']);
  if((price===''||price===null||price===undefined)&&parser==='madrid-library')price=true;
  let status=classify(price,desc,title,!!hasFlag);
  let url=secureLink(get(e,MAPPING.url));
  if(!url&&parser==='zaragoza'){
   const id=String(get(e,['id'])).match(/^(?:acto-)?(\d+)$/);
   if(id)url=`https://www.zaragoza.es/sede/servicio/cultura/evento/${id[1]}`;
  }
  if(!url){d.missingLink++;continue;}
  const rawPlace=get(e,MAPPING.place)||get(location,['title','name','address'])||get(address,['streetAddress','street-address']);
  const place=tidy(rawPlace)||city;
  const hour=tidy(get(e,MAPPING.time)).slice(0,36);
  const category=tidy(get(e,['TIPO','TIPO-ACTIVIDAD','TIPO-ACTIVIDAD-NOMBRE','CATEGORIA','categoria','category','tipo','tipoActividad','TIPO_EVENTO']));
  const kinds=kindsFor(title,desc,category);
  out.push({title,start:begin<from?from:begin,end:end||'',city,province:prov,place,time:hour,kind:kinds[0],kinds,description:desc,source,url,freeType:status==='condicional'?'condicional':'confirmada',status});
  d.classified[status]++;d.accepted++;
 }
 return out;
}
// Escapa únicamente controles no permitidos dentro de cadenas JSON. No repara
// archivos truncados ni cadenas con comillas inválidas: esos casos fallan y
// quedan documentados como error de fuente.
function escapeJsonStringControls(text){
 let quoted=false,escaped=false,result='',changed=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(escaped){result+=c;escaped=false;continue;}
  if(c==='\\'&&quoted){result+=c;escaped=true;continue;}
  if(c==='"'){quoted=!quoted;result+=c;continue;}
  if(quoted&&c.charCodeAt(0)<32){result+='\\u'+c.charCodeAt(0).toString(16).padStart(4,'0');changed=true;}
  else result+=c;
 }
 return changed?result:text;
}
async function readJob(job){
 const choices=job.urls||[job.url];const attempts=[];
 for(const url of choices){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12500);
  try{
   const asCsv=job.csv||/\.csv(?:[?#]|$)/i.test(url);
   const response=await fetch(url,{signal:ctrl.signal,headers:{accept:asCsv?'text/csv,text/plain,*/*':'application/json,*/*'},cf:{cacheEverything:true,cacheTtl:600}});
   if(!response.ok)throw new Error(`HTTP ${response.status}`);
   // El CSV de Madrid puede servirse como Windows-1252 (acentos y ordinales).
   // Decodificar bytes: nunca dejar que UTF-8 sustituya silenciosamente letras por �.
   const buffer=await response.arrayBuffer();
   let body;
   if(asCsv){
    try{body=new TextDecoder('utf-8',{fatal:true}).decode(buffer)}
    catch(_){body=new TextDecoder('windows-1252').decode(buffer)}
   }else body=new TextDecoder('utf-8').decode(buffer);
   let raw;
   if(asCsv){raw=rowsFromCSV(body);}else{
    // Los caracteres de control literales en cadenas rompen JSON.parse; se
    // escapan solo dentro de cadenas, sin alterar delimitadores ni estructura.
    try{raw=JSON.parse(body)}catch(firstError){
      const repaired=escapeJsonStringControls(body);
      if(repaired===body)throw firstError;
      raw=JSON.parse(repaired);
    }
   }
   if(!Array.isArray(raw)&&typeof raw!=='object')throw new Error('Formato de datos desconocido');
   if(!records(raw).length)throw new Error('Respuesta sin registros reconocibles');
   return {raw,endpoint:url};
  }catch(err){attempts.push(`${new URL(url).pathname.split('/').pop()}: ${err?.name==='AbortError'?'tiempo de espera':String(err?.message||err).slice(0,100)}`)}
  finally{clearTimeout(timer)}
 }
 throw new Error(attempts.join('; '));
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=180, s-maxage=600','x-content-type-options':'nosniff'}})}
export async function onRequestGet({request}){
 const p=new URL(request.url).searchParams;const province=tidy(p.get('province')).slice(0,80),city=tidy(p.get('city')).slice(0,80);const from=p.get('from')||'',to=p.get('to')||'';
 if(!province||!/^20\d\d-\d\d-\d\d$/.test(from)||!/^20\d\d-\d\d-\d\d$/.test(to)||to<from||(Date.parse(to)-Date.parse(from))/864e5>45)return json({events:[],notice:'Elige provincia y hasta 45 días.'},400);
 const region=Object.keys(REGIONS).find(k=>REGIONS[k].split('|').some(n=>norm(n)===norm(province)));
 const jobs=[...(SOURCE[region]||[])];
 if(norm(province)==='madrid')jobs.push(...SOURCE.madrid);
 if(norm(province)==='zaragoza')jobs.push(...SOURCE.zaragoza);
 if(norm(province)==='malaga')jobs.push(...SOURCE.malaga);
 if(norm(province)==='asturias')jobs.push(...SOURCE.gijon);
 if(!jobs.length)return json({events:[],stats:null,sources:[],failed:false,notice:'Aún no hay una API de actividades gratuitas conectada para esta provincia. Estamos ampliando ayuntamientos, diputaciones y asociaciones; no significa que no existan planes.'});
 const settled=await Promise.all(jobs.map(async j=>{
   const diagnostic={received:0,missingTitle:0,missingDate:0,outOfRange:0,missingPlace:0,wrongProvince:0,missingLink:0,accepted:0,classified:{gratis:0,condicional:0,pendiente:0,pago:0}};
   try{
    const downloaded=await readJob(j);
    const events=parse(downloaded.raw,from,to,j.name,province,j.parser,diagnostic);
    return {name:j.name,ok:true,events,diagnostic,endpoint:downloaded.endpoint};
   }catch(error){return {name:j.name,ok:false,events:[],diagnostic,error:String(error?.message||error).slice(0,240)};}
 }));
 const isMadrid=norm(province)==='madrid';
 let all,duplicates=0,conflicts=0;
 if(isMadrid){
 // Los duplicados se detectan antes de paginar. Un mismo título en dos
 // horarios o espacios distintos conserva sus sesiones por separado.
 const buckets=new Map();
 // Comparamos títulos tolerando una letra de sustitución U+FFFD procedente
 // de una copia antigua, pero manteniendo fecha, municipio, lugar y hora.
 const simple=v=>norm(v).replace(/[“”«»'’`]/g,'').replace(/\s+/g,' ').trim();
 const textEquivalent=(a,b)=>{
   const x=simple(a),y=simple(b);
   if(x===y)return true;
   if(x.length!==y.length||!x.includes('�')&&!y.includes('�'))return false;
   for(let i=0;i<x.length;i++)if(x[i]!==y[i]&&x[i]!=='�'&&y[i]!=='�')return false;
   return true;
 };
 const quality=v=>(String(v||'').match(/�/g)||[]).length;
 for(const ev of settled.flatMap(x=>x.events)){
  const group=ev.start+'|'+norm(ev.city);
  const bucket=buckets.get(group)||[];
  const hour=norm(ev.time),place=norm(ev.place)===norm(ev.city)?'':norm(ev.place);
  const previous=bucket.find(old=>{
    if(!textEquivalent(ev.title,old.title))return false;
    const oldHour=norm(old.time),oldPlace=norm(old.place)===norm(old.city)?'':norm(old.place);
    return (!hour||!oldHour||hour===oldHour) && (!place||!oldPlace||textEquivalent(place,oldPlace));
  });
  if(previous){
    duplicates++;
    if(previous.status!==ev.status){
      conflicts++;
      previous.status='pendiente';previous.freeType='pendiente';
    }
    if(quality(ev.title)<quality(previous.title))previous.title=ev.title;
    if(!previous.time&&ev.time)previous.time=ev.time;
    if((!previous.place||norm(previous.place)===norm(previous.city)||quality(ev.place)<quality(previous.place))&&ev.place)previous.place=ev.place;
    if(!previous.description&&ev.description)previous.description=ev.description;
    previous.kinds=[...new Set([...(previous.kinds||[previous.kind]),...(ev.kinds||[ev.kind])])];
    if(previous.kinds.includes('cultura'))previous.kind='cultura';
  }else bucket.push({...ev});
  buckets.set(group,bucket);
 }
 all=[...buckets.values()].flat();
 }else{
  // Mantener el comportamiento ya publicado para las demás provincias.
  const unique=new Map(),score={pendiente:0,pago:1,condicional:2,gratis:3};
  for(const ev of settled.flatMap(x=>x.events)){
   const id=norm(ev.title)+'|'+ev.start+'|'+norm(ev.city),prev=unique.get(id);
   if(prev&&prev.status!==ev.status){
    if(prev.status==='pendiente'||ev.status==='pendiente'||prev.status==='pago'||ev.status==='pago')unique.set(id,{...prev,status:'pendiente'});
    else unique.set(id,{...prev,status:'condicional',freeType:'condicional'});
    continue;
   }
   if(!prev||score[ev.status]>score[prev.status])unique.set(id,ev);
  }
  all=[...unique.values()];
 }
 const stats={total:all.length,gratis:0,condicional:0,pendiente:0,pago:0};
 for(const ev of all)stats[ev.status]++;
 // Orden cronológico primero, con la localidad elegida como desempate.
 const sortEvents=(a,b)=>a.start.localeCompare(b.start)||((norm(b.city)===norm(city)?1:0)-(norm(a.city)===norm(city)?1:0))||norm(a.title).localeCompare(norm(b.title),'es')||norm(a.time).localeCompare(norm(b.time));
 const checked=all.filter(x=>x.status==='gratis'||x.status==='condicional').sort(isMadrid?sortEvents:(a,b)=>a.start.localeCompare(b.start)||(norm(a.city)===norm(city)?-1:norm(b.city)===norm(city)?1:0));
 const type=p.get('type')||'todos';
 const selected=isMadrid&&['cultura','ferias','fiestas','familia'].includes(type)?checked.filter(e=>(e.kinds||[e.kind]).includes(type)):checked;
 const pageSize=isMadrid?24:120;
 const offset=isMadrid?Math.min(20000,Math.max(0,Number.parseInt(p.get('offset')||'0',10)||0)):0;
 const events=selected.slice(offset,offset+pageSize).map(({status,...ev})=>ev);
 const displayed=events.length,confirmed=checked.length;
 const working=[...new Set(settled.filter(x=>x.ok).map(x=>x.name))];const failures=settled.filter(x=>!x.ok).length;
 return json({events,displayed,confirmed,stats:failures===settled.length?null:stats,sources:working,sourceCount:jobs.length,failed:failures===settled.length,partial:failures>0,
  pagination:isMadrid?{offset,limit:pageSize,total:selected.length,hasMore:offset+displayed<selected.length}:undefined,
  deduplication:{duplicates,conflicts},
  diagnostic:isMadrid?settled.map(({name,ok,diagnostic,error})=>({name,ok,...diagnostic,...(error?{error}: {})})):undefined,
  notice:failures===settled.length?'No ha respondido ninguna fuente. No hay datos suficientes para contar actividades.':failures?`${failures} fuente(s) sin respuesta. El recuento es parcial.`:events.length?'':'No hay actividades gratuitas identificadas en las fuentes consultadas para este periodo. No significa que no existan.'});
}
