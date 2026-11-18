/** ¡Apáñate! · Agregador de planes gratuitos. Cloudflare Pages Function.
 * No infiere gratuidad de un recinto o del silencio del organizador.
 * Las tarjetas permanecen en nuestra web; solo el detalle incluye enlace al evento original.
 * Fuentes provinciales, autonómicas y municipales; las asociaciones de feriantes se incorporarán
 * únicamente cuando proporcionen fechas individualizadas y reutilizables, no páginas genéricas.
 */
const CYL='https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/eventos-de-la-agenda-cultural-categorizados-y-geolocalizados/records';
const SOURCE={
  madrid:[
    {name:'Madrid · Agenda municipal',url:'https://datos.madrid.es/id/id/dataset/300107-0-agenda-actividades-eventos/resource/300107-5-agenda-actividades-eventos-json/download/300107-5-agenda-actividades-eventos-json.json',parser:'madrid'},
    {name:'Madrid · Bibliotecas gratuitas',url:'https://datos.madrid.es/id/id/dataset/206717-0-agenda-eventos-bibliotecas/resource/206717-4-agenda-eventos-bibliotecas-csv/download/206717-4-agenda-eventos-bibliotecas-csv.csv',parser:'madrid',csv:true}
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
const tidy=x=>String(x??'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/ig,' ').replace(/&amp;/ig,'&').replace(/\s+/g,' ').trim().slice(0,750);
const get=(o,fields)=>{if(!o||typeof o!=='object')return '';for(const f of fields){let v=o[f];if(v!==undefined&&v!==null&&v!=='')return v;}return ''};
function secureLink(u){if(!u)return '';try{let s=String(u).trim();if(s.startsWith('http://') && /^http:\/\/(www\.madrid\.es|www\.zaragoza\.es|www\.gijon\.es|www\.cultura\.jcyl\.es)/.test(s))s='https://'+s.slice(7);let v=new URL(s);return v.protocol==='https:'?v.href:''}catch{return ''}}
function isoDate(x){if(!x)return '';if(typeof x==='object')return isoDate(get(x,['start','value','date','fecha']));let s=String(x),m=s.match(/(20\d\d)-(\d\d)-(\d\d)/);if(m)return m[0];m=s.match(/^(\d\d)[\/\-](\d\d)[\/\-](20\d\d)/);return m?`${m[3]}-${m[2]}-${m[1]}`:''}
function isFree(x){if(x===true||x===1||x===0)return true;let s=norm(x);return /^(si|s[ií]|true|1|gratis|gratuito|gratuita|free|entrada libre|0|0[.,]00\s*(?:€|euros)?)$/.test(s)}
function descriptionFree(s){return /(?:entrada|acceso|actividad|participaci[oó]n|inscripci[oó]n|evento|visita|concierto|taller|espect[aá]culo)\s+(?:(?:totalmente|completamente)\s+)?(?:libre|gratuita?|sin coste)|gratuit[ao]\s+(?:para|hasta|al)|entrada\s+libre|acceso\s+libre|sin\s+coste/i.test(s) && !/(?:no\s+gratuit[oa]|de pago|no es gratis|tarifa de entrada)/i.test(s)}
const kind=s=>{s=norm(s);if(/feria|mercadillo|mercado artesanal/.test(s))return'ferias';if(/fiestas patronales|romeria|verbena|fiesta popular/.test(s))return'fiestas';if(/familia|infantil|cuentacuentos|ninos|niñas|ninos/.test(s))return'familia';return'cultura'};
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
function parse(raw,from,to,source,province,parser){let out=[];for(const obj of records(raw)){
 const e=obj.fields||obj.properties||obj;
 const title=tidy(get(e,MAPPING.title));if(!title)continue;
 const desc=tidy(get(e,MAPPING.description));const price=get(e,MAPPING.cost);
 if(!isFree(price)&&!descriptionFree(desc))continue;
 const begin=isoDate(get(e,MAPPING.begin));const end=isoDate(get(e,MAPPING.end));if(!begin||begin>to||(end||begin)<from)continue;
 let location=e.location||e.ubicacion||{};if(Array.isArray(location))location=location[0]||{};
 const address=location.address||{};
 let city=tidy(get(e,MAPPING.city)||get(location,['name','locality','city','municipio'])||get(address,['addressLocality','city']));
 let prov=tidy(get(e,MAPPING.province)||get(address,['addressRegion','province']));
 const assumed={madrid:['Madrid','Madrid'],zaragoza:['Zaragoza','Zaragoza'],malaga:['Málaga','Málaga'],gijon:['Gijón','Asturias']};
 if(assumed[parser]){city=city||assumed[parser][0];prov=assumed[parser][1]}
 if(!prov && parser==='cyl'){
     // Some record versions use a localized field label.
     prov=tidy(get(e,['nombreprovincia','nombreProvincia','provincia_nombre']));
 }
 if(!city || !prov || norm(prov)!==norm(province))continue;
 let place=tidy(get(e,MAPPING.place)||get(location,['title','name'])||get(address,['streetAddress','street-address']));if(!place)place=city;
 let url=secureLink(get(e,MAPPING.url));
 if(!url && parser==='zaragoza'){
   let id=String(get(e,['id'])).match(/^(?:acto-)?(\d+)$/);if(id)url=`https://www.zaragoza.es/sede/servicio/cultura/evento/${id[1]}`;
 }
 if(!url)continue;
 const hour=tidy(get(e,MAPPING.time)).slice(0,36);
 out.push({title,start:begin<from?from:begin,end:end||'',city,province:prov,place,time:hour,kind:kind(title+' '+desc),description:desc,source,url,freeType:'confirmada'});
 }return out;}
async function readJob(job){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),9000);try{let r=await fetch(job.url,{signal:ctrl.signal,headers:{accept:job.csv?'text/csv,text/plain,*/*':'application/json,*/*'},cf:{cacheEverything:true,cacheTtl:900}});if(!r.ok)throw new Error('HTTP '+r.status);return job.csv?rowsFromCSV(await r.text()):await r.json()}finally{clearTimeout(timer)}}
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
 if(!jobs.length)return json({events:[],sources:[],failed:false,notice:'Aún no hay una API de actividades gratuitas conectada para esta provincia. Estamos ampliando ayuntamientos, diputaciones y asociaciones; no significa que no existan planes.'});
 const settled=await Promise.all(jobs.map(async j=>{try{const records=await readJob(j);return {name:j.name,ok:true,events:parse(records,from,to,j.name,province,j.parser)}}catch(e){return {name:j.name,ok:false,events:[]}}}));
 const unique=new Map();for(const ev of settled.flatMap(x=>x.events)){let id=norm(ev.title)+'|'+ev.start+'|'+norm(ev.city);if(!unique.has(id))unique.set(id,ev)}
 const all=[...unique.values()].sort((a,b)=>a.start.localeCompare(b.start)||(norm(a.city)===norm(city)?-1:norm(b.city)===norm(city)?1:0));
 const events=all.slice(0,120);const working=[...new Set(settled.filter(x=>x.ok).map(x=>x.name))];const failures=settled.filter(x=>!x.ok).length;
 return json({events,sources:working,failed:failures===settled.length,notice:failures?`${failures} fuente(s) sin respuesta. Solo se publican eventos con gratuidad explícita, fecha y enlace.`:events.length?'':'No hemos encontrado actividades que cumplan todos los requisitos en estas fuentes y fechas; no significa que no las haya.'});
}
