/** ¡Apáñate! · Agregador de planes gratuitos. Cloudflare Pages Function.
 * No infiere gratuidad de un recinto o del silencio del organizador.
 * Las tarjetas permanecen en nuestra web; solo el detalle incluye enlace al evento original.
 * Fuentes provinciales, autonómicas y municipales; las asociaciones de feriantes se incorporarán
 * únicamente cuando proporcionen fechas individualizadas y reutilizables, no páginas genéricas.
 */
const CYL='https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/eventos-de-la-agenda-cultural-categorizados-y-geolocalizados/records';
const SOURCE={
  madrid:[
    // Agenda autonómica: abarca municipios fuera de Madrid capital. La fuente
    // es una página de eventos oficial, no un API de datos abiertos; el lector
    // valida título, fecha, enlace individual y gratuidad antes de publicar.
    {name:'Comunidad de Madrid · Actividades',parser:'comunidad-madrid',htmlPages:3,url:'https://www.comunidad.madrid/actividades'},
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
  // Barcelona capital: tres canales independientes. JSON paginado (nunca descargar
  // los archivos gigantes de 110-210 MB), CSV municipal y agenda HTML oficial.
  // El scraping es solo complemento: una respuesta vacía queda en diagnóstico.
  barcelona:[
    {name:'Barcelona · Agenda JSON (API municipal)',parser:'barcelona',jsonPaged:true,
     resourceId:'da9e71de-0f8e-417d-928a-56380bfd0231',pages:3,limit:200},
    {name:'Barcelona · Agenda cultural CSV',parser:'barcelona',csv:true,
     url:'https://opendata-ajuntament.barcelona.cat/data/dataset/2767159c-1c98-46b8-a686-2b25b40cb053/resource/3abb2414-1ee0-446e-9c25-380e938adb73/download'},
    {name:'Barcelona · Agenda oficial (acceso gratuito)',parser:'barcelona-html',
     url:'https://agenda500.barcelona.cat/es/llistat?ajax=search&canal=agenda500&cerca=*:*&d=mes&nr=60&pg=search&sort=namesort,asc&ticket=3&wtarget=agenda500&xout=1'}
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
  if(value===true||value===1||/^(1|si|sí|true|gratis|gratuit|gratuita|gratuito)$/i.test(String(value??'').trim()))return 'free';
  if(value===false||value===0||/^(0|no|false)$/i.test(String(value??'').trim()))return 'paid';
  return 'unknown';
 }
 if(value===true)return 'free';if(value===false)return 'unknown';
 if(typeof value==='number')return value===0?'free':value>0?'paid':'unknown';
 const str=norm(value);if(!str)return 'unknown';
 if(/^(si|sí|true|gratis|gratuit|gratuito|gratuita|free|entrada libre|acceso libre|sin coste|0|0[.,]00\s*(?:€|euros)?)$/.test(str))return 'free';
 if(/^(no|false|de pagament|de pago|pago|entrada de pago)$/.test(str))return 'paid';
 const amount=str.match(/^(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)$/);
 if(amount)return Number(amount[1].replace(',','.'))===0?'free':'paid';
 return 'unknown';
}
function classify(cost,description,title,asFlag=false){
 const full=norm(`${title} ${description}`), costStatus=priceSignal(cost,asFlag);
 const conditional=/(?:gratuit[ao]s?|gratis|entrada libre|acceso libre|sin coste)[^.;]{0,90}(?:para (?:menores|mayores|residentes|empadronados|jovenes|estudiantes|personas|ciudadan|familias|desempleados|miembros)|con (?:carnet|acreditacion|reserva)|solo (?:los|para|en)|excepto|hasta \d+ anos)|(?:residentes|empadronados|menores|mayores|jovenes|estudiantes|personas con discapacidad)[^.;]{0,80}(?:gratis|gratuit[ao]s?|entrada libre)/.test(full);
 const textFree=/(?:entrada|acceso|actividad|participacion|inscripcion|evento|visita|concierto|taller|espectaculo|asistencia|jornada)s?\s+(?:(?:totalmente|completamente)\s+)?(?:libre|gratuit[ao]s?|sin coste)|\bentrada\s+libre\b|\bacceso\s+libre\b|\bsin\s+coste\b|\bgratuit[ao]s?\b|\bgratuits?\b|\bgratis\b|\bentrada\s+lliure\b|\bactivitat\s+gratuita?\b/.test(full);
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
 if(/\b(feria|ferias|ferial|fira|fires|mercat artesanal|mercadillo|mercado artesanal|mercado medieval)\b/.test(s))kinds.push('ferias');
 if(/\b(fiesta patronal|fiestas patronales|festa major|festes majors|revetlla|romeria|verbena|fiesta popular|fiestas populares|carnaval|cabalgata|verbenas)\b/.test(s))kinds.push('fiestas');
 const family=/\b(familia|familiar|familias|infantil|infancia|cuentacuentos|contacontes|infants|nens|nenes|ninos|ninas|peques|bebes|juvenil)\b/.test(s);
 if(family)kinds.push('familia');
 // Cultura es una categoría amplia, también para propuestas familiares culturales.
 if(!kinds.includes('ferias')&&!kinds.includes('fiestas')||/teatro|teatre|musica|concert|concierto|dansa|danza|libro|llibre|lectura|biblioteca|conte|cuento|exposicio|exposicion|taller|cine|cinema|cultura|poesia|literatura|visita guiada/.test(s))kinds.push('cultura');
 return [...new Set(kinds.length?kinds:['cultura'])];
}
function eventKinds(e){
 const vals=[...(Array.isArray(e.kinds)?e.kinds:[]),e.kind];
 return [...new Set(vals.filter(Boolean).map(x=>{
  const v=norm(x);
  return v==='en familia'||v==='familiar'||v==='infantil'?'familia':v;
 }))];
}
const kind=s=>kindsFor(s,'','')[0];
function records(raw){if(Array.isArray(raw))return raw;if(Array.isArray(raw?.result?.records))return raw.result.records;for(const k of ['@graph','results','result','records','features','events','items','data','listado'])if(Array.isArray(raw?.[k]))return raw[k];if(Array.isArray(raw?.result?.records))return raw.result.records;if(Array.isArray(raw?.response?.docs))return raw.response.docs;return []}
function rowsFromCSV(txt){const first=(txt.replace(/^\uFEFF/,'').split(/\r?\n/)[0]||'');const sep=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';let arr=[],row=[],value='',quoted=false;for(let i=0;i<txt.length;i++){const c=txt[i];if(c==='"'){if(quoted&&txt[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(c===sep&&!quoted){row.push(value);value=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&txt[i+1]==='\n')i++;row.push(value);if(row.some(v=>v.trim()))arr.push(row);row=[];value=''}else value+=c}row.push(value);if(row.some(v=>v.trim()))arr.push(row);const names=(arr.shift()||[]).map(x=>x.trim().replace(/^\uFEFF/,''));return arr.slice(0,30000).map(r=>Object.fromEntries(names.map((n,i)=>[n,r[i]||''])))}
const MAPPING={
 title:['NOM_ACTIVITAT','NOM','ACTIVITAT','TITOL','TITULO','TITULO-ACTIVIDAD','titulo','title','nombre','name','denominacion','nombre_evento','titulo_es','nombreActividad'],
 begin:['DATA_INICI','DATA','DATA_INI','DATA_INICI_ACTIVITAT','DATA_ACTE','DATA_INICI_ACTE','start_date','data_inici','FECHA','fecha_inicio','Fecha de inicio','dtstart','DTSTART','fechaInicio','FECHA-INICIO','fechainicio','startDate','date','fecha','inicio','start','fechas'],
 end:['DATA_FI','DATA_FINAL','data_fi','FECHA-FIN','fecha_fin','Fecha de fin','endDate','end','fechaFin'],
 cost:['GRATUIT','GRATUITAT','ES_GRATUIT','PREU','preu','preu_entrada','GRATUITO','gratuito','GRATUITA','free','gratis','gratuita','es_gratuito','freeAdmission','precio','PRECIO','Precio','tarifa'],
 description:['DESCRIPCIO','descripcio','TEXT','TEXT_ACTIVITAT','DESCRIPCION','descripcion','description','texto','observaciones','condiciones','detalle','contenido','resumen','entradilla'],
 city:['MUNICIPI','NOM_MUNICIPI','POBLACIO','municipi','nombre_localidad','Nombre Localidad','localidad','LOCALIDAD','municipio','poblacion','nombre_municipio','city','ciudad','municipality','poblacion_nombre'],
 province:['PROVINCIA_NOM','NOM_PROVINCIA','nombre_provincia','Nombre Provincia','provincia','PROVINCIA','province','comarca_provincia'],
 place:['EQUIPAMENT','NOM_EQUIPAMENT','ESPAI','LLOC','ADRECA','NOM_LLOC','lugar_celebracion','Lugar de celebración','NOMBRE-INSTALACION','nombre_instalacion','lugar','lugar_de_celebracion','address','direccion','ubicacion','nombre_lugar'],
 url:['URL','URL_ACTIVITAT','ENLLAC','ENLLAC_ACTIVITAT','WEB','ENLACE','CONTENT-URL','URL-ACTIVIDAD','content-url','url_actividad','enlace_al_contenido','Enlace al contenido','enlace_evento','url','link','enlace','web','id_url','url_evento','@id'],
 time:['HORA_INICI','hora_inici','HORA','hora_inicio','Hora inicio','hora','time']
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
  const assumed={madrid:['Madrid','Madrid'],'madrid-library':['Madrid','Madrid'],barcelona:['Barcelona','Barcelona'],zaragoza:['Zaragoza','Zaragoza'],malaga:['Málaga','Málaga'],gijon:['Gijón','Asturias']};
  if(assumed[parser]){city=city||assumed[parser][0];prov=prov||assumed[parser][1];}
  if(!prov&&parser==='cyl')prov=tidy(get(e,['nombreprovincia','nombreProvincia','provincia_nombre']));
  if(!city||!prov){d.missingPlace++;continue;}
  if(norm(prov)!==norm(province)){d.wrongProvince++;continue;}
  const desc=tidy(get(e,MAPPING.description));
  const hasFlag=['GRATUIT','GRATUITAT','ES_GRATUIT','GRATUITO','gratuito','GRATUITA','gratis','gratuita','es_gratuito','freeAdmission','free'].find(k=>Object.prototype.hasOwnProperty.call(e,k)&&e[k]!==''&&e[k]!==null);
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
  const category=tidy(get(e,['TEMATICA','CATEGORIA_ACTIVITAT','TIPUS','TIPO','TIPO-ACTIVIDAD','TIPO-ACTIVIDAD-NOMBRE','CATEGORIA','categoria','category','tipo','tipoActividad','TIPO_EVENTO']));
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

// Lector conservador de la agenda autonómica de comunidad.madrid.
// Solo se publican fichas individuales con fecha, lugar y evidencia explícita
// de gratuidad. Una ausencia de la palabra «Gratis» NO implica precio cero.
const MADRID_MUNICIPIOS=['Alcalá de Henares','Alcobendas','Alcorcón','Aranjuez','Arganda del Rey','Boadilla del Monte','Collado Villalba','Colmenar Viejo','Coslada','Fuenlabrada','Getafe','Leganés','Majadahonda','Móstoles','Parla','Pinto','Pozuelo de Alarcón','Rivas-Vaciamadrid','Las Rozas','San Fernando de Henares','San Lorenzo de El Escorial','San Sebastián de los Reyes','Torrejón de Ardoz','Tres Cantos','Valdemoro','Villaviciosa de Odón','Los Molinos','Daganzo de Arriba','Navalcarnero','Madrid'];
function decodeHtml(x){return String(x||'').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&(?:amp|quot|apos|lt|gt|nbsp|aacute|eacute|iacute|oacute|uacute|ntilde);/gi,m=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' ','&aacute;':'á','&eacute;':'é','&iacute;':'í','&oacute;':'ó','&uacute;':'ú','&ntilde;':'ñ'}[m.toLowerCase()]||m));}
function htmlText(x){return tidy(decodeHtml(String(x||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')));}
const MONTHS={ene:1,enero:1,feb:2,febrero:2,mar:3,marzo:3,abr:4,abril:4,may:5,mayo:5,jun:6,junio:6,jul:7,julio:7,ago:8,agosto:8,sep:9,sept:9,septiembre:9,oct:10,octubre:10,nov:11,noviembre:11,dic:12,diciembre:12};
function spanishDate(text,yearHint){
 const clean=norm(text).replace(/\s+/g,' ');
 const m=clean.match(/\b(\d{1,2})\s*(?:-|al\s+\d{1,2}\s+)?\s*(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|sept|oct|nov|dic)\b(?:\s+(?:de\s+)?(20\d{2}))?/);
 if(!m)return '';
 const mm=MONTHS[m[2]],year=+(m[3]||yearHint);
 if(!mm||!year)return '';
 const date=`${year}-${String(mm).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
 return !Number.isNaN(Date.parse(date))?date:'';
}
function regionalMadridEntries(html,from,to){
 // Se estudian las tarjetas con URL individual a /actividades/, no enlaces a
 // portadas, búsquedas, imágenes o páginas generales.
 const anchor=/<a\b([^>]*\bhref\s*=\s*(["'])(.*?)\2[^>]*)>([\s\S]*?)<\/a>/gi;
 const matches=[];let a;
 while((a=anchor.exec(html))){
  let url;try{url=new URL(decodeHtml(a[3]),'https://www.comunidad.madrid')}catch{continue}
  if(url.hostname!=='www.comunidad.madrid'||!/^\/actividades\/(?:20\d{2}\/)?[\w-]+\/?$/.test(url.pathname))continue;
  const title=htmlText(a[4]);
  if(title.length<8||title.length>180||/^(ver m[aá]s|m[aá]s informaci[oó]n|consulta|inscrib)/i.test(title))continue;
  matches.push({title,url:url.href,from:a.index,to:anchor.lastIndex});
 }
 const result=[];const seen=new Set();
 const yearHint=+(from.slice(0,4));
 for(let i=0;i<matches.length;i++){
  const hit=matches[i],prev=matches[i-1];
  // La ficha del evento contiene la fecha, el lugar y la gratuidad próximos
  // al enlace del título. Evitar mezclarla con la siguiente tarjeta.
  const previousStart=prev?prev.to:Math.max(0,hit.from-1200);
  const preceding=htmlText(html.slice(Math.max(previousStart,hit.from-600),hit.from));
  const next=matches[i+1];
  const tail=htmlText(html.slice(hit.to,Math.min(next?next.from:hit.to+1400,hit.to+1600)));
  const summary=(preceding+' '+tail).slice(0,1800);
  const date=spanishDate(tail,yearHint)||spanishDate(preceding,yearHint);
  if(!date||date<from||date>to)continue;
  const short=tail.slice(0,550);
  const status=/\b(gratis|gratuit[ao]s?|entrada libre|acceso libre)\b/i.test(short)?'gratis':'pendiente';
  const conditional=/(?:gratis|gratuit[ao])[^.]{0,70}(?:para|solo|residentes|menores|mayores)/i.test(short);
  const actualStatus=status==='gratis'&&conditional?'condicional':status;
  const matchCity=MADRID_MUNICIPIOS.find(x=>new RegExp('(?:^|[^a-záéíóúñ])'+norm(x).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:$|[^a-záéíóúñ])','i').test(norm(short)));
  const city=matchCity||'Comunidad de Madrid';
  // La localidad desconocida se declara autonómica, nunca se inventa «Madrid».
  const timeMatch=short.match(/\b(\d{1,2}:\d{2})\b/);
  let venue=short.replace(/^(?:\s|[-–|])+/,'').slice(0,220);
  const dateIndex=venue.search(/\b\d{1,2}\s+(?:de\s+)?(?:noviembre|octubre|diciembre|septiembre|enero|febrero|marzo|abril|mayo|junio|julio|agosto|nov|oct|dic|sep)\b/i);
  if(dateIndex>=0)venue=venue.slice(dateIndex).replace(/^.{0,110}?(?:\d{4}|\d{2}:\d{2})/,'').trim();
  venue=venue.replace(/\b(?:Gratis|Actividad gratuita|Requiere inscripción|Inscripciones cerradas)\b[\s\S]*$/i,'').replace(/^[-–|·,\s]+|[-–|·,\s]+$/g,'').slice(0,120);
  if(!venue||venue.length<4)venue='Lugar indicado en la ficha oficial';
  const key=norm(hit.title)+'|'+date+'|'+norm(venue);
  if(seen.has(key))continue;seen.add(key);
  const category=preceding.slice(-120);
  const kinds=kindsFor(hit.title,summary,category);
  result.push({title:hit.title,start:date,end:'',city,province:'Madrid',place:venue,time:timeMatch?.[1]||'',kind:kinds[0],kinds,description:summary.slice(0,320),source:'Comunidad de Madrid · Agenda de actividades',url:hit.url,freeType:actualStatus==='condicional'?'condicional':'confirmada',status:actualStatus});
 }
 return result;
}
async function readMadridRegional(job,from,to){
 const pages=Array.from({length:job.htmlPages||1},(_,i)=>i);
 const results=await Promise.all(pages.map(async page=>{
  const url=job.url+'?page='+page;
  const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),11000);
  try{
   const res=await fetch(url,{signal:ctl.signal,headers:{accept:'text/html'},cf:{cacheEverything:true,cacheTtl:900}});
   if(!res.ok)throw Error('HTTP '+res.status);
   const content=await res.text();
   const parsed=regionalMadridEntries(content,'2020-01-01','2099-12-31');
   // Una página vacía no es un error si otras páginas aportan eventos.
   return {parsed,ok:true};
  }catch(e){return {parsed:[],ok:false,error:String(e.message||e)}}finally{clearTimeout(timer)}
 }));
 if(results.every(x=>!x.ok))throw Error('No respondió el buscador autonómico: '+results.map(x=>x.error).filter(Boolean).join('; '));
 const rawEvents=results.flatMap(x=>x.parsed);
 if(!rawEvents.length)throw Error('La fuente respondió, pero el lector no pudo extraer fichas fechadas. Revisión necesaria.');
 const events=rawEvents.filter(e=>e.start>=from&&e.start<=to);
 return {events,received:rawEvents.length,outOfRange:rawEvents.length-events.length,pageErrors:results.filter(x=>!x.ok).length};
}

// JSON de Open Data BCN: lectura por API CKAN paginada, no por archivo masivo.
async function readBarcelonaJson(job){
 const rows=[];let pages=0;
 for(let page=0;page<(job.pages||3);page++){
  const u='https://opendata-ajuntament.barcelona.cat/data/api/action/datastore_search?'+
   new URLSearchParams({resource_id:job.resourceId,limit:String(job.limit||200),offset:String(page*(job.limit||200))});
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),10000);
  try{
   const response=await fetch(u,{signal:ctl.signal,headers:{accept:'application/json'},cf:{cacheEverything:true,cacheTtl:900}});
   if(!response.ok)throw Error(`HTTP ${response.status}`);
   const data=await response.json();
   if(data.success!==true||!Array.isArray(data.result?.records))throw Error('La API no devolvió registros CKAN reconocibles');
   rows.push(...data.result.records);pages++;
   if(data.result.records.length<(job.limit||200))break;
  }finally{clearTimeout(timer)}
 }
 if(!rows.length)throw Error('La API JSON no devolvió registros; comprobar si el recurso admite DataStore');
 return {raw:rows,endpoint:'Open Data BCN / datastore_search',pageErrors:0};
}
function barcelonaHtmlEntries(html,from,to){
 // Fichas individuales en Agenda 500, con filtro oficial ticket=3 (gratis).
 // No considerar gratuito ningún enlace fuera de una ficha fechada.
 const hits=[];const re=/<a\b([^>]*\bhref\s*=\s*["']([^"']*\/detall\/[^"']+)["'][^>]*)>([\s\S]*?)<\/a>/gi;
 let m;const seen=new Set();
 while((m=re.exec(html))!==null){
  const urlStr=m[2].replace(/&amp;/g,'&');
  let url;try{url=new URL(urlStr,'https://agenda500.barcelona.cat');if(url.hostname!=='agenda500.barcelona.cat')continue;}catch{continue;}
  const title=tidy(htmlText(m[3]));if(title.length<5||title.length>210)continue;
  const marker=url.pathname+'|'+title;
  if(seen.has(marker))continue;seen.add(marker);
  hits.push({title,url:url.href,index:m.index,end:re.lastIndex});
 }
 const parsed=[],allCandidates=hits.length;
 for(let i=0;i<hits.length;i++){
  const hit=hits[i],next=hits[i+1];
  const text=htmlText(html.slice(hit.end,Math.min(hit.end+1900,next?next.index:hit.end+1900)));
  const date=text.match(/(?:Del?\s+)?(\d{1,2})\/(\d{1,2})\/(20\d{2})(?:\s+al\s+(\d{1,2})\/(\d{1,2})\/(20\d{2}))?/i);
  if(!date)continue; // Eventos permanentes sin fechas concretas se excluyen.
  const first=`${date[3]}-${date[2].padStart(2,'0')}-${date[1].padStart(2,'0')}`;
  const last=date[6]?`${date[6]}-${date[5].padStart(2,'0')}-${date[4].padStart(2,'0')}`:first;
  if(first>to||last<from)continue;
  const where=text.match(/(?:D[oó]nde|On)\s*:\s*([^\n]{3,160}?)(?=\s+(?:Cu[aá]ndo|Quan)\s*:|$)/i);
  const place=tidy(where?.[1]||'Barcelona · lugar detallado por el organizador').slice(0,120);
  const kinds=kindsFor(hit.title,text,'');
  parsed.push({title:hit.title,start:first<from?from:first,end:last,city:'Barcelona',province:'Barcelona',place,time:'',kind:kinds[0],kinds,description:text.slice(0,320),source:'Barcelona · Agenda oficial (acceso gratuito)',url:hit.url,freeType:'confirmada',status:'gratis'});
 }
 return {events:parsed,received:allCandidates,outOfRange:Math.max(0,allCandidates-parsed.length)};
}
async function readBarcelonaHtml(job,from,to){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
 try{
  const r=await fetch(job.url,{signal:ctl.signal,headers:{accept:'text/html'},cf:{cacheEverything:true,cacheTtl:900}});
  if(!r.ok)throw Error(`HTTP ${r.status}`);
  const html=await r.text();
  const result=barcelonaHtmlEntries(html,from,to);
  if(!result.received)throw Error('HTML recibido sin fichas reconocibles; revisar el lector');
  return result;
 }finally{clearTimeout(timer)}
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
 if(norm(province)==='barcelona')jobs.push(...SOURCE.barcelona);
 if(norm(province)==='zaragoza')jobs.push(...SOURCE.zaragoza);
 if(norm(province)==='malaga')jobs.push(...SOURCE.malaga);
 if(norm(province)==='asturias')jobs.push(...SOURCE.gijon);
 if(!jobs.length)return json({events:[],stats:null,sources:[],failed:false,notice:'Aún no hay una API de actividades gratuitas conectada para esta provincia. Estamos ampliando ayuntamientos, diputaciones y asociaciones; no significa que no existan planes.'});
 const settled=await Promise.all(jobs.map(async j=>{
   const diagnostic={received:0,missingTitle:0,missingDate:0,outOfRange:0,missingPlace:0,wrongProvince:0,missingLink:0,accepted:0,classified:{gratis:0,condicional:0,pendiente:0,pago:0}};
   try{
    if(j.parser==='barcelona-html'){
      const result=await readBarcelonaHtml(j,from,to);
      diagnostic.received=result.received;diagnostic.outOfRange=result.outOfRange;diagnostic.accepted=result.events.length;
      for(const ev of result.events)diagnostic.classified[ev.status]++;
      return {name:j.name,ok:true,events:result.events,diagnostic,endpoint:j.url};
    }
    if(j.parser==='comunidad-madrid'){
      const regional=await readMadridRegional(j,from,to);
      diagnostic.received=regional.received;
      diagnostic.outOfRange=regional.outOfRange;
      diagnostic.accepted=regional.events.length;
      for(const ev of regional.events)diagnostic.classified[ev.status]++;
      return {name:j.name,ok:true,events:regional.events,diagnostic,endpoint:j.url,pageErrors:regional.pageErrors};
    }
    const downloaded=j.jsonPaged?await readBarcelonaJson(j):await readJob(j);
    const events=parse(downloaded.raw,from,to,j.name,province,j.parser,diagnostic);
    return {name:j.name,ok:true,events,diagnostic,endpoint:downloaded.endpoint};
   }catch(error){return {name:j.name,ok:false,events:[],diagnostic,error:String(error?.message||error).slice(0,240)};}
 }));
 const isMadrid=norm(province)==='madrid';
 const isPilot=isMadrid||norm(province)==='barcelona';
 let all,duplicates=0,conflicts=0;
 if(isPilot){
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
    previous.kinds=[...new Set([...eventKinds(previous),...eventKinds(ev)])];
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
 const checked=all.filter(x=>x.status==='gratis'||x.status==='condicional').sort(isPilot?sortEvents:(a,b)=>a.start.localeCompare(b.start)||(norm(a.city)===norm(city)?-1:norm(b.city)===norm(city)?1:0));
 const type=p.get('type')||'todos';
 const selected=isPilot&&['cultura','ferias','fiestas','familia'].includes(type)?checked.filter(e=>eventKinds(e).includes(type)):checked;
 const pageSize=isPilot?24:120;
 const offset=isPilot?Math.min(20000,Math.max(0,Number.parseInt(p.get('offset')||'0',10)||0)):0;
 const events=selected.slice(offset,offset+pageSize).map(({status,...ev})=>ev);
 const displayed=events.length,confirmed=checked.length;
 const working=[...new Set(settled.filter(x=>x.ok).map(x=>x.name))];const failures=settled.filter(x=>!x.ok).length+settled.reduce((n,x)=>n+(x.pageErrors||0),0);
 return json({events,displayed,confirmed,requestedType:type,stats:working.length===0?null:stats,sources:working,sourceCount:jobs.length,failed:working.length===0,partial:failures>0,
  pagination:isPilot?{offset,limit:pageSize,total:selected.length,hasMore:offset+displayed<selected.length}:undefined,
  deduplication:{duplicates,conflicts},
  diagnostic:isPilot?settled.map(({name,ok,diagnostic,error,pageErrors})=>({name,ok,...diagnostic,...(pageErrors?{error:`${pageErrors} página(s) de la agenda autonómica no respondieron`}:{}),...(error?{error}: {})})):undefined,
  notice:working.length===0?'No ha respondido ninguna fuente. No hay datos suficientes para contar actividades.':failures?`${failures} fuente(s) sin respuesta. El recuento es parcial.`:events.length?'':'No hay actividades gratuitas identificadas en las fuentes consultadas para este periodo. No significa que no existan.'});
}
