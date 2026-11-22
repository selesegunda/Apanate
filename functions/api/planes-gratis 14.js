/** ¡Apáñate! · Agregador de planes gratuitos. Cloudflare Pages Function.
 * No infiere gratuidad de un recinto o del silencio del organizador.
 * Las tarjetas permanecen en nuestra web; solo el detalle incluye enlace al evento original.
 * Fuentes provinciales, autonómicas y municipales; las asociaciones de feriantes se incorporarán
 * únicamente cuando proporcionen fechas individualizadas y reutilizables, no páginas genéricas.
 */
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
  // Barcelona capital: datos AUTORIZADOS y vigentes de Generalitat (Socrata),
  // más Agenda 500 municipal (HTML). Se elimina Open Data BCN agenda-diaria:
  // su cobertura termina en 2025 y su DataStore devolvía 404.
  barcelona:[
    // Una sola descarga paginada. JSON es el formato principal y CSV es el respaldo,
    // nunca dos copias simultáneas del mismo conjunto de datos.
    {name:'Barcelona · Generalitat cultural (JSON/CSV)',parser:'catalonia-json',dataset:'rhpv-yr4f'},
    {name:'Diputació de Barcelona · Agenda turística',parser:'diba-tourism',url:'https://do.diba.cat/api/dataset/actesturisme_ca/format/json/pag-ini/1/pag-fi/150'},
    {name:'Barcelona · Agenda 500 (acceso gratuito)',parser:'barcelona-html',
     url:'https://agenda500.barcelona.cat/es/llistat?ajax=search&canal=agenda500&cerca=*:*&d=mes&nr=60&pg=search&sort=popularity%2Cdesc&ticket=3&wtarget=agenda500&xout=1'}
  ],
  // Primera fase de municipios de la provincia de Barcelona. Cada fuente conserva
  // su municipio declarado: nunca se asignan localizaciones por defecto a terceros.
  barcelonaMunicipios:[
    // La fuente municipal oficial es prioritaria. Solo se mostrarán registros
    // si su CSV contiene fecha, título, enlace HTTPS y gratuidad contrastable.
    // La fuente provincial queda como alternativa, sin atribuirle otras ciudades.
    {name:'L’Hospitalet · Agenda municipal / Diputació',parser:'municipal-barcelona',municipio:'L’Hospitalet de Llobregat',dibaCode:'08101',municipalCsvUrl:'https://dadesobertes.seu-e.cat/dataset/a01d7e53-c4c8-40a1-83f2-4cff9ea8acf2/resource/fd1d251a-fa70-4522-b805-a964f063c6c8/download/agenda_actes.csv'},
    {name:'Badalona · Diputació de Barcelona',parser:'municipal-barcelona',municipio:'Badalona',dibaCode:'08015'},
    {name:'Santa Coloma · Agenda municipal',parser:'municipal-barcelona',municipio:'Santa Coloma de Gramenet',csv:true,url:'https://dadesobertes.seu-e.cat/csv/santacolomadegramenet/ADOvstActivitatsAgenda.csv'}
  ],
  cyl:[{name:'Castilla y León · Agenda cultural (D1)',parser:'cyl-d1'}],
  // Fuente común documentada: eventos organizados o participados por la Junta.
  // No equivale a toda la Agenda Cultural andaluza. No se reutiliza esta última sin licencia verificada.
  andalucia:[
    {name:'Junta de Andalucía · Eventos institucionales (datos abiertos)',parser:'andalucia-open-data'},
    {name:'Ayuntamiento de Sevilla · ICAS (agenda cultural)',parser:'sevilla-icas',url:'https://icas.sevilla.org/agenda'},
    {name:'Diputación de Sevilla · Agenda provincial',parser:'sevilla-diputacion',url:'https://www.dipusevilla.es/agenda-de-la-provincia/'}
  ],
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
 const paidText=/(?:\bde pago\b|\bentrada[s]?\s+(?:de pago|desde \d+)|\bprecio\s*[:=]\s*[1-9]\d*|\btarifa\s*[:=]\s*[1-9]\d*|\bno\s+(?:es\s+)?gratuit[ao]|\bactivitat\s+(?:de\s+)?pagament|\bactividad\s+de\s+pago)/.test(full);
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
function records(raw){if(Array.isArray(raw))return raw;if(Array.isArray(raw?.result?.records))return raw.result.records;for(const k of ['@graph','results','result','records','features','events','items','data','listado','elements','entries'])if(Array.isArray(raw?.[k]))return raw[k];if(Array.isArray(raw?.result?.records))return raw.result.records;if(Array.isArray(raw?.response?.docs))return raw.response.docs;return []}
function rowsFromCSV(txt){const first=(txt.replace(/^\uFEFF/,'').split(/\r?\n/)[0]||'');const sep=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';let arr=[],row=[],value='',quoted=false;for(let i=0;i<txt.length;i++){const c=txt[i];if(c==='"'){if(quoted&&txt[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(c===sep&&!quoted){row.push(value);value=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&txt[i+1]==='\n')i++;row.push(value);if(row.some(v=>v.trim()))arr.push(row);row=[];value=''}else value+=c}row.push(value);if(row.some(v=>v.trim()))arr.push(row);const names=(arr.shift()||[]).map(x=>x.trim().replace(/^\uFEFF/,''));return arr.slice(0,30000).map(r=>Object.fromEntries(names.map((n,i)=>[n,r[i]||''])))}
const MAPPING={
 title:['NOM_ACTIVITAT','NOM','titol','ACTIVITAT','TITOL','TITULO','TITULO-ACTIVIDAD','titulo','title','nombre','name','titol','denominacion','nombre_evento','titulo_es','nombreActividad'],
 begin:['DATA_INICI','DATA','DATA_INI','DATA_INICI_ACTIVITAT','DATA_ACTE','DATA_INICI_ACTE','start_date','data_inici','FECHA','fecha_inicio','Fecha de inicio','dtstart','DTSTART','fechaInicio','FECHA-INICIO','fechainicio','startDate','date','fecha','inicio','start','fechas'],
 end:['DATA_FI','DATA_FINAL','data_fi','FECHA-FIN','fecha_fin','Fecha de fin','endDate','end','fechaFin'],
 cost:['GRATUIT','GRATUITAT','ES_GRATUIT','PREU','preu','preu_entrada','GRATUITO','gratuito','GRATUITA','free','gratis','gratuita','es_gratuito','freeAdmission','preu','precio','PRECIO','Precio','tarifa'],
 description:['DESCRIPCIO','descripcio','TEXT','TEXT_ACTIVITAT','DESCRIPCION','descripcion','description','texto','observaciones','condiciones','detalle','contenido','resumen','entradilla'],
 city:['MUNICIPI','NOM_MUNICIPI','municipi_nom','POBLACIO','municipi','nombre_localidad','Nombre Localidad','localidad','LOCALIDAD','municipio','poblacion','nombre_municipio','municipi_nom','city','ciudad','municipality','poblacion_nombre'],
 province:['PROVINCIA_NOM','NOM_PROVINCIA','nombre_provincia','Nombre Provincia','provincia','PROVINCIA','province','comarca_provincia'],
 place:['EQUIPAMENT','NOM_EQUIPAMENT','ESPAI','adreca_nom','LLOC','ADRECA','NOM_LLOC','lugar_celebracion','Lugar de celebración','NOMBRE-INSTALACION','nombre_instalacion','lugar','lugar_de_celebracion','address','direccion','ubicacion','nombre_lugar'],
 url:['URL','URL_ACTIVITAT','acte_url','ENLLAC','ENLLAC_ACTIVITAT','WEB','ENLACE','CONTENT-URL','URL-ACTIVIDAD','content-url','url_actividad','enlace_al_contenido','Enlace al contenido','enlace_evento','url','link','acte_url','enlace','web','id_url','url_evento','@id'],
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
  if(parser==='diba-tourism')prov='Barcelona';
  const assumed={madrid:['Madrid','Madrid'],'madrid-library':['Madrid','Madrid'],barcelona:['Barcelona','Barcelona'],zaragoza:['Zaragoza','Zaragoza'],malaga:['Málaga','Málaga'],gijon:['Gijón','Asturias']};
  if(assumed[parser]){city=city||assumed[parser][0];prov=prov||assumed[parser][1];}
  if(!prov&&parser==='cyl')prov=tidy(get(e,['nombreprovincia','nombreProvincia','provincia_nombre']));
  if(!prov){d.missingPlace++;continue;} if(!city)d.missingPlace++;
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

// Conjuntos autonómicos vigentes: consultamos su esquema antes de pedir datos.
// Los campos Socrata cambian entre conjuntos; nunca suponemos que los campos
// de 2021 de Open Data BCN siguen vigentes.
const CT_API='https://analisi.transparenciacatalunya.cat';
const normalizedKey=s=>norm(s).replace(/[^a-z0-9]/g,'');
function fieldValue(e,regexes){
 for(const [key,value] of Object.entries(e||{})){
  if(regexes.some(r=>r.test(normalizedKey(key)))&&value!==null&&value!==undefined&&value!=='')return value;
 }
 return '';
}
async function fetchTimed(url,accept='application/json',ms=14000){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ms);
 try{const res=await fetch(url,{signal:controller.signal,headers:{accept},cf:{cacheEverything:true,cacheTtl:900}});
  if(!res.ok)throw Error(`HTTP ${res.status}`);
  return res;
 }finally{clearTimeout(timer)}
}
function socrataDateColumn(columns){
 return columns.find(c=>/date|calendar_date/.test(c.dataTypeName||'')&&/data.*(inici|comenc|acte)|(?:fecha|date).*?(inicio|inici|start)|^data$|^datainici$/.test(normalizedKey(c.fieldName||c.name)))
  ||columns.find(c=>/date|calendar_date/.test(c.dataTypeName||'')&&/inici|start|comen/.test(normalizedKey(c.fieldName||c.name)))
  ||columns.find(c=>/date|calendar_date/.test(c.dataTypeName||''));
}
// Prioriza los eventos que continúan vigentes: inicio <= fin del intervalo y
// final >= inicio del intervalo. Una fecha final vacía exige inicio vigente.
// El filtro funciona únicamente con columnas de fecha reconocidas por Socrata.
function cataloniaDateFields(columns){
 const dated=columns.filter(c=>/date|calendar_date/i.test(c.dataTypeName||''));
 const start=dated.find(c=>/^datainici$/.test(normalizedKey(c.fieldName||c.name)))||socrataDateColumn(dated);
 const end=dated.find(c=>/^datafi$/.test(normalizedKey(c.fieldName||c.name)))||dated.find(c=>/data.*(fi|final)|enddate/.test(normalizedKey(c.fieldName||c.name)));
 return {start,end};
}
// Dos consultas independientes: cierres aún vigentes y nuevas aperturas.
// Un mismo registro puede aparecer en ambas. Se compara ANTES de clasificarlo.
function cataloniaRecordKey(record){
 const e=record?.fields||record||{};
 const id=tidy(fieldValue(e,[/^codi$/, /^acteid$/, /^eventid$/]));
 const beginning=isoDate(fieldValue(e,[/^datainici$/, /^data.*inici/, /^start.*date/]));
 const ending=isoDate(fieldValue(e,[/^datafi$/, /^data.*fi$/, /^end.*date/]));
 const location=norm(tidy(fieldValue(e,[/^comarcaimunicipi$/, /^municipi$/, /^nommunicipi$/, /^localitat$/])));
 const place=norm(tidy(fieldValue(e,[/^nomequip/, /^nomeespai/, /^nomlloc/, /^equipament/, /^espai/, /^lloc/, /^adreca/])))
 const time=norm(tidy(fieldValue(e,[/^horari$/, /^horainici$/, /^hora/])))
 const title=norm(tidy(fieldValue(e,[/^denominaci/, /^titol/, /^nom.*activ/, /^title$/])));
 // El identificador oficial solo permite fusionar la MISMA sesión y lugar.
 // Si falta ID, exigimos título y fecha además de localización/hora.
 return id?`id:${norm(id)}|${beginning}|${ending}|${location}|${place}|${time}`:
  title&&beginning?`event:${title}|${beginning}|${ending}|${location}|${place}|${time}`:'';
}
async function readCatalonia(job,from,to){
 const meta=await (await fetchTimed(`${CT_API}/api/views/${job.dataset}.json`)).json();
 const cols=(meta.columns||[]).filter(x=>x.fieldName&&!x.fieldName.startsWith(':'));
 if(!cols.length)throw Error('No fue posible consultar columnas del conjunto oficial');
 const {start,end}=cataloniaDateFields(cols);
 if(!start||!end||!/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(start.fieldName)||!/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(end.fieldName))
  throw Error('Las fechas de inicio y fin no están declaradas como columnas de fecha: se evita una descarga incompleta');
 const startDate=`'${from}T00:00:00'`,finishDate=`'${to}T23:59:59'`;
 const queries=[
  {name:'cierreVigente',where:`${end.fieldName} >= ${startDate} AND (${start.fieldName} <= ${finishDate} OR ${start.fieldName} IS NULL)`},
  {name:'aperturaEnPeriodo',where:`${start.fieldName} >= ${startDate} AND ${start.fieldName} <= ${finishDate}`}
 ];
 const PAGE=1000,MAX_PAGES=8;
 let lastError=null;
 // Si JSON falla, repetir AMBAS consultas en CSV. Nunca unir descargas parciales.
 for(const ext of ['json','csv']){
  const recordsByKey=new Map();const keyOrigins=new Map();
  let endpoint='',pages=0,partial=false,overlap=0,repeatedWithinQuery=0;
  const counts={cierreVigente:0,aperturaEnPeriodo:0};
  try{
   for(const query of queries){
    for(let page=0;page<MAX_PAGES;page++){
     const q=new URLSearchParams({'$where':query.where,'$order':`${start.fieldName} ASC, :id ASC`,'$limit':String(PAGE),'$offset':String(page*PAGE)});
     endpoint=`${CT_API}/resource/${job.dataset}.${ext}?${q}`;
     const response=await fetchTimed(endpoint,ext==='csv'?'text/csv':'application/json',18000);
     const body=await response.text();
     const chunk=ext==='csv'?rowsFromCSV(body):JSON.parse(body);
     if(!Array.isArray(chunk))throw Error('La respuesta no es una lista');
     counts[query.name]+=chunk.length;pages++;
     for(const record of chunk){
      const key=cataloniaRecordKey(record);
      // Registros sin identidad segura no se descartan ni se fusionan a ciegas.
      const stable=key||`unidentified:${query.name}:${page}:${recordsByKey.size}`;
      if(recordsByKey.has(stable)){
       if(keyOrigins.get(stable)!==query.name)overlap++;
       else repeatedWithinQuery++;
      }else {recordsByKey.set(stable,record);keyOrigins.set(stable,query.name);}
     }
     if(chunk.length<PAGE)break;
     if(page===MAX_PAGES-1)partial=true;
    }
   }
   return {raw:[...recordsByKey.values()],endpoint,pages,partial,format:ext,dateFiltered:true,
    queryCounts:counts,queryDuplicates:overlap,queryRepeated:repeatedWithinQuery};
  }catch(error){lastError=error; /* No unir registros incompletos de distintas consultas ni formatos. */}
 }
 throw Error(`Generalitat JSON y CSV fallaron: ${String(lastError?.message||lastError).slice(0,180)}`);
}
// Las comarcas permiten atribuir municipio y provincia sin adivinar por texto libre.
// Si la fuente no especifica provincia/comarca, solo se aceptan localidades
// de pertenencia conocida, en vez de asignar por defecto toda Cataluña a Barcelona.
const BCN_COMARQUES=new Set(['alt penedes','anoia','bages','baix llobregat','barcelones','bergueda','garraf','maresme','moianes','osona','valles occidental','valles oriental','llucanes']);
const BCN_KNOWN_MUNICIPALITIES=new Set([
 'barcelona','badalona','lhospitalet de llobregat','hospitalet de llobregat','santa coloma de gramenet',
 'sant adria de besos','sant boi de llobregat','cornella de llobregat','el prat de llobregat',
 'esplugues de llobregat','sant joan despi','sant just desvern','sant feliu de llobregat',
 'sant vicenc dels horts','sant andreu de la barca','palleja','molins de rei',
 'castelldefels','gava','viladecans','begues','torrelles de llobregat',
 'sant climent de llobregat','santa coloma de cervello','sant esteve sesrovires',
 'cervello','corbera de llobregat','la palma de cervello','sant cugat del valles',
 'cerdanyola del valles','ripollet','montcada i reixac','barbera del valles',
 'badia del valles','tiana','montgat','sabadell','terrassa','mataro','granollers',
 'manresa','vic','igualada','vilafranca del penedes','vilanova i la geltru',
 'sitges','sant pere de ribes','premia de mar','el masnou','arenys de mar',
 'calella','pineda de mar','santa susanna','malgrat de mar','cardedeu',
 'mollet del valles','parets del valles','la roca del valles','sant celoni',
 'berga','sant sadurni d anoia'
]);
function cataloniaLocation(e){
 const raw=tidy(fieldValue(e,[/^municipi$/, /^nommunicipi$/, /^comarcaimunicipi$/, /^poblacio$/, /^localitat$/, /^ciutat$/]));
 const explicitProvince=norm(tidy(fieldValue(e,[/^provincia$/, /^nomprovincia$/])));
 if(!raw||explicitProvince&&explicitProvince!=='barcelona')return '';
 const parts=raw.split(/\s*(?:\||\/|;|>|,| · | - )\s*/).map(x=>x.trim()).filter(Boolean);
 const comarca=parts.find(x=>BCN_COMARQUES.has(norm(x)));
 // La localidad debe ser distinta de la comarca y no ser únicamente un nombre provincial.
 const municipalities=parts.filter(x=>!BCN_COMARQUES.has(norm(x))&&norm(x)!=='provincia de barcelona');
 if(!municipalities.length)return '';
 const city=municipalities[municipalities.length-1];
 if(comarca||explicitProvince==='barcelona'||BCN_KNOWN_MUNICIPALITIES.has(norm(city).replace(/[’']/g,'')))return city;
 return '';
}
function cataloniaLink(e){
 const value=fieldValue(e,[/^urlactivitat$/, /^enllaos$/, /^enllacos$/, /^enllacos?$/, /^enllac1url$/, /^linkbotoentrades$/, /^url.*activ/, /^enllac/, /^web.*activ/, /^url$/, /^link$/]);
 if(Array.isArray(value)){
  for(const item of value){const u=cataloniaLink({urlactivitat:typeof item==='string'?item:(item?.url||item?.href||item?.enllac)});if(u)return u;}
  return '';
 }
 if(value&&typeof value==='object')return secureLink(value.url||value.href||value.enllac||value.value);
 const text=String(value||'');
 const matches=text.match(/https?:\/\/[^\s"'<>]+/g)||[];
 for(const candidate of matches){const u=secureLink(candidate.replace(/[),.;]+$/,''));if(u)return u;}
 return secureLink(text);
}
function cataloniaEvents(raw,from,to,source,diagnostic){
 diagnostic.received=raw.length;const events=[];
 diagnostic.fields=Object.keys(raw.find(x=>x&&typeof x==='object')||{}).slice(0,28).join(', ').slice(0,480);
 for(const record of raw){
  const e=record.fields||record;
  const title=tidy(fieldValue(e,[/^denominaci/,/^titol/,/^titul/,/^nom.*activ/,/^nom.*esdev/,/^activitat$/, /^nom$/, /^title$/, /^event.*name/]));
  const rawBegin=fieldValue(e,[/^datainici$/, /^data.*inici/, /^data.*comenc/, /^data.*celebr/, /^start.*date/, /^fecha.*inicio/, /^inici$/, /^dataacte/, /^fecha/]);
  const rawEnd=fieldValue(e,[/^datafi$/, /^datafinal/, /^data.*fi$/, /^data.*final/, /^end.*date/, /^finalitzacio/]);
  const start=isoDate(rawBegin),end=isoDate(rawEnd);
  if(!title){diagnostic.missingTitle++;continue;}
  if(!start){diagnostic.missingDate++;continue;}
  if(start>to||(end||start)<from){diagnostic.outOfRange++;continue;}
  const municipality=cataloniaLocation(e);
  if(!municipality){diagnostic.missingPlace++;continue;}
  const place=tidy(fieldValue(e,[/^nomequip/,/^nomeespai/,/^nomlocalitz/,/^nomlloc/,/^nomrecinte/,/^equipament/,/^espai/,/^lloc/,/^adrea/,/^adreca/,/^localitzacio/]))||municipality;
  const desc=tidy(fieldValue(e,[/^descripci/,/^resum/,/^text/,/^observacio/]));
  const explicitFlag=fieldValue(e,[/^gratuita$/, /^gratuit$/, /^esgratuit/, /^gratuitat$/]);
  const hasFlag=Object.keys(e).some(k=>/^(gratuita|gratuit|esgratuit|gratuitat)$/.test(normalizedKey(k)))&&explicitFlag!=='';
  const price=hasFlag?explicitFlag:fieldValue(e,[/^preu$/, /^cost$/, /^tarifa$/, /^entrades$/]);
  const status=classify(price,desc,title,hasFlag);
  const url=cataloniaLink(e);
  if(!url){diagnostic.missingLink++;continue;}
  const categories=tidy(fieldValue(e,[/^tagscategories$/, /^tagsmbits$/, /^tagsaltrescategories$/, /^categoria/, /^tematica/, /^tipus/, /^ambit/]));
  const kinds=kindsFor(title,desc,categories);
  events.push({title,start:start<from?from:start,end:end||'',city:municipality,province:'Barcelona',place,time:tidy(fieldValue(e,[/^horari$/, /^horainici$/, /^hora/])),kind:kinds[0],kinds,description:desc,source,url,status,freeType:status==='condicional'?'condicional':'confirmada'});
  diagnostic.classified[status]++;diagnostic.accepted++;
 }
 return events;
}

// Municipio siempre demostrado por la fuente específica (ayuntamiento) o por
// el campo geográfico explícito (Diputació). No inferir un municipio de un texto
// publicitario ni de una comarca. Las fuentes sin fecha/enlace no generan planes.
function municipalRecords(raw){
 if(Array.isArray(raw))return raw;
 const direct=records(raw);if(direct.length)return direct;
 for(const key of ['elements','items','resultats','actes','datasets','rows']){
  if(Array.isArray(raw?.[key]))return raw[key];
  if(Array.isArray(raw?.data?.[key]))return raw.data[key];
  if(Array.isArray(raw?.result?.[key]))return raw.result[key];
 }
 return [];
}
// La Diputació representa municipios como relaciones (a veces código 08015,
// otras como objeto/lista). Solo aceptar coincidencias expresas de código o nombre.
function dibaMunicipalityMatches(e,job){
 const raw=fieldValue(e,[/^municipinom$/, /^nommunicipi$/, /^relmunicipis$/, /^municipi$/]);
 const tokens=[];
 function visit(v,depth=0){
  if(depth>3||v===null||v===undefined)return;
  if(Array.isArray(v)){for(const item of v)visit(item,depth+1);return;}
  if(typeof v==='object'){
   for(const [k,x] of Object.entries(v))if(/^(?:id|codi|code|valor|value|nom|name|municipi|municipinom|relmunicipis)$/i.test(k))visit(x,depth+1);
   return;
  }
  tokens.push(String(v));
 }
 visit(raw);
 const expected=norm(job.municipio).replace(/[’']/g,'');
 return tokens.some(v=>{
  const n=norm(v).replace(/[’']/g,'');
  return n===expected||n===job.dibaCode||new RegExp('(?:^|[^0-9])'+job.dibaCode+'(?:[^0-9]|$)').test(n);
 });
}
function municipalBarcelonaEvents(raw,from,to,job,d){
 const items=municipalRecords(raw);
 d.received=items.length;
 d.fields=Object.keys(items.find(x=>x&&typeof x==='object')||{}).slice(0,30).join(', ').slice(0,480);
 const result=[];
 for(const original of items){
  const e=original?.properties||original?.fields||original;
  if(!e||typeof e!=='object'){d.missingTitle++;continue;}
  const val=patterns=>tidy(fieldValue(e,patterns));
  const isColoma=job.municipio==='Santa Coloma de Gramenet';
  const isHospitaletCsv=!!job.hospitaletCsv;
  const title=val(isHospitaletCsv?[/^titol$/, /^titolactivitat$/, /^nomactivitat$/, /^nomacte$/, /^activitat$/, /^denominacio$/, /^nom$/, /^title$/, /^descripcio$/]:isColoma?[/^descripcio$/, /^titol$/, /^nom$/]:[/^titol$/, /^titolact/, /^titolactiv/, /^titol.*act/, /^nomactiv/, /^activitat$/, /^activitatnom$/, /^denominaci/, /^nomacte/, /^title$/, /^nombre$/, /^nom$/, /^descripciobreu$/]);
  // Santa Coloma incluye fechas del registro y de la sesión; priorizar la sesión
  // solo cuando el valor sea una fecha válida, nunca cuando sea una hora.
  const start=(isColoma?isoDate(fieldValue(e,[/^inicievent$/])):'')||isoDate(fieldValue(e,[/^datainici$/, /^datainicial$/, /^datainicidela/, /^datainici/, /^dataacte$/, /^dataactivitat$/, /^diaactivitat$/, /^data$/, /^inici$/, /^fecha.*inicio/, /^startdate$/]));
  const end=(isColoma?isoDate(fieldValue(e,[/^fievent$/])):'')||isoDate(fieldValue(e,[/^dataacabament$/, /^datafi$/, /^datafinal$/, /^datafinalitzacio$/, /^datafinal/, /^enddate$/]))||start;
  if(!title){d.missingTitle++;continue;}
  if(!start){d.missingDate++;continue;}
  if(start>to||end<from){d.outOfRange++;continue;}
  if(job.dibaCode&&!isHospitaletCsv){
   if(!dibaMunicipalityMatches(e,job)){d.missingPlace++;continue;}
  }else{
   const declared=val([/^municipinom$/, /^nommunicipi$/, /^municipi$/, /^localitat$/, /^poblacio$/, /^ciutat$/, /^city$/]);
   if(declared&&norm(declared)!==norm(job.municipio)){d.wrongProvince++;continue;}
  }
  const place=val(isColoma?[/^centre$/, /^adrecanom$/, /^nomlloc$/, /^equipament$/, /^espai$/]:[/^adrecanom$/, /^nomlloc$/, /^nomequipament$/, /^equipament$/, /^espai$/, /^lloc$/, /^adreca$/, /^direccion$/, /^ubicacio$/])||job.municipio;
  const desc=val(isColoma?[/^descripcio$/, /^centre$/]:[/^descripcio$/, /^descripcioact/, /^descripcio.*activ/, /^resum$/, /^observaci/, /^contingut$/, /^text$/]);
  const rawUrl=fieldValue(e,isHospitaletCsv?[/^urlactivitat$/, /^urlacte$/, /^enllacactivitat$/, /^urlfitxa$/, /^url$/, /^enllac$/, /^web$/, /^link$/]:isColoma?[/^urll$/, /^url$/, /^enllac$/, /^link$/]:[/^urlacte$/, /^acteurl$/, /^urlactiv/, /^urlinscrip/, /^urlenllac/, /^enllacweb$/, /^enllac$/, /^url$/, /^web$/, /^link$/, /^enlace$/, /^urlgeneral$/, /^url.*general$/]);
  const link=secureLink(typeof rawUrl==='object'?(rawUrl?.url||rawUrl?.href||rawUrl?.value):rawUrl);
  if(!link){
   d.missingLink++;
   if(isColoma){
    const signal=classify(fieldValue(e,[/^preu$/, /^precio$/, /^cost$/, /^tarifa$/]),desc,title);
    if(signal==='gratis')d.missingLinkFree=(d.missingLinkFree||0)+1;
    else d.missingLinkUnverified=(d.missingLinkUnverified||0)+1;
   }
   continue;
  }
  const freeFlag=fieldValue(e,[/^gratuita$/, /^gratuit$/, /^esgratuita$/, /^esgratuit$/]);
  const hasFlag=freeFlag!==''&&freeFlag!==undefined&&freeFlag!==null;
  const cost=hasFlag?freeFlag:fieldValue(e,[/^preu$/, /^precio$/, /^cost$/, /^tarifa$/, /^entrades$/, /^preuentrada$/]);
  const status=classify(cost,desc,title,hasFlag);
  const categories=val([/^categoria$/, /^categories$/, /^tipus$/, /^tags$/, /^tematica$/, /^public$/]);
  const kinds=kindsFor(title,desc,categories);
  result.push({title,start:start<from?from:start,end:end===start?'':end,city:job.municipio,province:'Barcelona',place,
   time:val(isColoma?[/^horaevent$/, /^horari$/, /^hora$/]:[/^horari$/, /^horainici$/, /^hora$/, /^hores$/]),kind:kinds[0],kinds,description:desc,source:job.name,url:link,
   status,freeType:status==='condicional'?'condicional':'confirmada'});
  d.classified[status]++;d.accepted++;
 }
 return result;
}

// Agenda 500 · listado oficial filtrado por ticket=3 (Gratis).
// La vista a veces devuelve el menú y las cabeceras sin fichas: nunca convertir
// una página genérica en planes gratuitos ni fabricar enlaces /detall/.
function barcelonaHtmlEntries(html,from,to){
 const root='https://agenda500.barcelona.cat';
 const rawHtml=String(html||'').replace(/\\u002[fF]/g,'/').replace(/\\\//g,'/');
 const headings=[...rawHtml.matchAll(/<h[234]\b[^>]*>([\s\S]*?)<\/h[234]>/gi)];
 const anchor=/<a\b[^>]*\bhref\s*=\s*(?:(["'])([\s\S]*?)\1|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
 const links=[...rawHtml.matchAll(anchor)];
 const details=[];
 const allowedLink=raw=>{
  try{
   const text=decodeHtml(raw||'').replace(/&amp;/g,'&').trim();
   const u=new URL(text,root);
   if(!['agenda500.barcelona.cat','guia.barcelona.cat'].includes(u.hostname)||!/(?:^|\/)detall\//i.test(u.pathname))return null;
   u.hash='';return u.href;
  }catch{return null;}
 };
 for(const a of links){
  const href=allowedLink(a[2]||a[3]);if(!href)continue;
  details.push({index:a.index,end:a.index+a[0].length,href,title:htmlText(a[4])});
 }
 const cards=[],seen=new Set();
 for(const h of headings){
  const title=htmlText(h[1]);
  if(title.length<5||title.length>230||/^(?:filtros|cu[aá]ndo|entrada|precio|distrito|ordenar por)$/i.test(title))continue;
  const inside=details.find(a=>a.index>=h.index&&a.end<=h.index+h[0].length);
  const near=inside||details.find(a=>Math.abs(a.index-h.index)<550&&a.index>=h.index-250);
  if(!near||seen.has(near.href))continue;
  seen.add(near.href);cards.push({title,url:near.href,startIndex:h.index,endIndex:h.index+h[0].length});
 }
 cards.sort((a,b)=>a.startIndex-b.startIndex);
 const parsed=[],cardResults=[];
 for(let i=0;i<cards.length;i++){
  const c=cards[i],next=cards[i+1];
  const block=htmlText(rawHtml.slice(c.endIndex,Math.min(rawHtml.length,next?next.startIndex:c.endIndex+2500,c.endIndex+2500)));
  const where=block.match(/(?:D[oó]nde|On|Where)\s*:?\s*(.*?)(?=\s+(?:Cu[aá]ndo|Quan|When)\s*:?|$)/i);
  const place=tidy(where?.[1]||'').slice(0,180);
  // Las fichas permanentes no llevan sesión fechada: identificarlas aparte,
  // nunca convertirlas en una actividad de hoy o sumar «fecha ilegible».
  const permanent=/(?:evento|esdeveniment|event)\s+permanent(?:e)?/i.test(block);
  const when=block.match(/(?:Cu[aá]ndo|Quan|When)\s*:?\s*(?:Del?\s+|De\s+|Des\s+de\s+)?(\d{1,2}[\/\-.]\d{1,2}[\/\-.]20\d{2})(?:\s+(?:a|al|fins al|hasta el|to|fins)\s+(\d{1,2}[\/\-.]\d{1,2}[\/\-.]20\d{2}))?/i);
  let reason='',ev=null;
  if(permanent)reason='permanent';
  else if(!when)reason='missingDate';
  else{
   const first=isoDate(when[1].replace(/[.\-]/g,'/'));
   const last=isoDate((when[2]||when[1]).replace(/[.\-]/g,'/'));
   if(!first||!last||last<first)reason='missingDate';
   else if(first>to||last<from)reason='outOfRange';
   else if(!place)reason='missingPlace';
   else{
    const kinds=kindsFor(c.title,block,'');
    // start se ajusta a la ventana para que se vea una actividad que
    // comenzó antes; las fechas oficiales completas quedan conservadas.
    ev={title:c.title,start:first<from?from:first,end:last,originalStart:first,originalEnd:last,
      city:'Barcelona',province:'Barcelona',place,time:'',kind:kinds[0],kinds,
      description:block.slice(0,320),source:'Barcelona · Agenda 500 (acceso gratuito)',
      url:c.url,status:'gratis',freeType:'confirmada'};
   }
  }
  cardResults.push({url:c.url,reason:reason||'valid',event:ev});
  if(ev)parsed.push(ev);
 }
 const sampleLinks=links.map(a=>{
  try{return new URL(decodeHtml(a[2]||a[3]||''),root).pathname.slice(0,65);}catch{return '';}
 }).filter(Boolean).filter((v,i,all)=>all.indexOf(v)===i).slice(0,5);
 const debug=cards.length?`Fichas ${cards.length}`:
  `Sin fichas /detall/: HTML ${html.length} caracteres; enlaces ${links.length}; H2-H4 ${headings.length}; rutas ${sampleLinks.join(', ')||'ninguna'}`;
 return {events:parsed,cardResults,received:cards.length,debug};
}
async function readBarcelonaHtml(job,from,to){
 // Agenda 500 ofrece resultados de 30 días. Filtramos por el intervalo elegido
 // sin inventar parámetros de búsqueda de fecha que no se han contrastado.
 const official=new URL('https://agenda500.barcelona.cat/es/llistat');
 for(const [key,value] of Object.entries({ajax:'search',canal:'agenda500',cerca:'*:*',d:'mes',nr:'10',pg:'search',sort:'namesort,asc',ticket:'3',wtarget:'agenda500',xout:'1'}))official.searchParams.set(key,value);
 const candidate=(size,extra={})=>{
  const u=new URL(official);u.searchParams.set('nr',String(size));
  for(const [key,value] of Object.entries(extra))u.searchParams.set(key,String(value));
  return u.href;
 };
 // Un registro diagnóstico por ficha individual, no por consulta HTTP.
 const cardsByUrl=new Map(),errors=[],seenResponses=new Set();
 const priority={valid:5,outOfRange:4,permanent:3,missingPlace:2,missingDate:1};
 let maxResponseCards=0;
 const fetchBatch=async urls=>{
  const results=await Promise.all(urls.map(async url=>{
   try{
    const response=await fetchTimed(url,'text/html',12000);
    const html=await response.text();
    return {url,result:barcelonaHtmlEntries(html,from,to)};
   }catch(error){return {url,error:String(error?.message||error).slice(0,90)};}
  }));
  for(const entry of results){
   if(entry.error){errors.push(entry.error);continue;}
   const r=entry.result;
   const fingerprint=r.cardResults.map(c=>c.url).sort().join('|');
   if(seenResponses.has(fingerprint))continue;
   seenResponses.add(fingerprint);
   maxResponseCards=Math.max(maxResponseCards,r.received);
   for(const card of r.cardResults){
    const old=cardsByUrl.get(card.url);
    if(!old||(priority[card.reason]||0)>(priority[old.reason]||0))cardsByUrl.set(card.url,card);
   }
   if(!r.received)errors.push(r.debug);
  }
 };
 await fetchBatch([candidate(60),candidate(30),candidate(10)]);
 if(maxResponseCards>0&&cardsByUrl.size<=10){
  await fetchBatch([candidate(10,{start:10}),candidate(10,{page:2})]);
 }
 if(!maxResponseCards)throw Error('Agenda 500: '+errors.join(' | ').slice(0,210));
 const all=[...cardsByUrl.values()];
 const events=all.filter(c=>c.reason==='valid').map(c=>c.event);
 const count=key=>all.filter(c=>c.reason===key).length;
 const outOfRange=count('outOfRange'),missingDate=count('missingDate');
 const missingPlace=count('missingPlace'),permanent=count('permanent');
 return {events,received:all.length,outOfRange,missingDate,missingPlace,permanent,
  debug:`Fichas únicas ${all.length}; válidas ${events.length}; permanentes ${permanent}; fecha no reconocida ${missingDate}; fuera de período ${outOfRange}; sin lugar ${missingPlace}; máximo por respuesta ${maxResponseCards}; consultas ${seenResponses.size}`};
}

async function readJob(job){
 const choices=job.urls||[job.url];const attempts=[];
 for(const url of choices){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12500);
  try{
   const asCsv=/\.csv(?:[?#]|$)/i.test(url) || (job.csv && !/\.json(?:[?#]|$)/i.test(url));
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
   if(!(job.parser==='municipal-barcelona'?municipalRecords(raw):records(raw)).length&&!job.allowEmpty)throw new Error('Respuesta sin registros reconocibles');
   return {raw,endpoint:url};
  }catch(err){attempts.push(`${new URL(url).pathname.split('/').pop()}: ${err?.name==='AbortError'?'tiempo de espera':String(err?.message||err).slice(0,100)}`)}
  finally{clearTimeout(timer)}
 }
 throw new Error(attempts.join('; '));
}
// UNA fuente oficial para las ocho provincias, sin inventar eventos, fechas ni gratuidad.
// Las fechas de inscripción no son necesariamente fechas de celebración; se excluyen.
function andaluciaRows(raw){
 const standard=records(raw);
 if(standard.length)return standard;
 for(const path of [raw?.hits?.hits,raw?.result?.items,raw?.result?.results,raw?.result?.data,raw?.response?.results,raw?.data?.items]){
  if(Array.isArray(path))return path;
 }
 return [];
}
function andaluciaObjects(raw){
 return andaluciaRows(raw).map(r=>{
  const e=r?._source?.data||r?._source||r?.fields||r?.properties?.data||r?.properties||r?.data||r;
  return e&&typeof e==='object'&&!Array.isArray(e)?e:{};
 });
}
function andaluciaValue(e,names){
 const normalized=new Map(Object.entries(e||{}).map(([k,v])=>[norm(k).replace(/[^a-z0-9]/g,''),v]));
 for(const k of names){const v=normalized.get(norm(k).replace(/[^a-z0-9]/g,''));if(v!==undefined&&v!==null&&v!=='')return v;}
 return '';
}
const ANDALUCIA_PROVINCES=['Almería','Cádiz','Córdoba','Granada','Huelva','Jaén','Málaga','Sevilla'];
const ANDALUCIA_CODES={'04':'Almería','11':'Cádiz','14':'Córdoba','18':'Granada','21':'Huelva','23':'Jaén','29':'Málaga','41':'Sevilla'};
function andaluciaProvince(raw){
 const value=tidy(raw);const n=norm(value);
 if(ANDALUCIA_CODES[value])return ANDALUCIA_CODES[value];
 const exact=ANDALUCIA_PROVINCES.find(p=>norm(p)===n);
 return exact||'';
}
function andaluciaEvents(raw,from,to,source,requestedProvince,d){
 const out=[];const items=andaluciaObjects(raw);d.received=items.length;
 d.fields=[...new Set(items.slice(0,8).flatMap(e=>Object.keys(e)))].slice(0,60).join(', ');
 d.missingEventDate=0;d.registrationDatesOnly=0;d.unknownProvince=0;
 for(const e of items){
  const val=(...keys)=>andaluciaValue(e,keys);
  const title=tidy(val('titulo','título','title','nombre','denominacion','denominación','nombre_evento','nombreActividad'));
  if(!title){d.missingTitle++;continue;}
  // No utilizar start_date_registration / end_date_registration: plazos de inscripción.
  const start=isoDate(val('fecha_inicio','fechaInicio','fechainicio','fecha_de_inicio','startDate','start_date','fecha_celebracion','event_start_date','fecha','inicio','date','f_inicio','fechaDesde'));
  const end=isoDate(val('fecha_fin','fechaFin','fechafin','fecha_de_fin','endDate','end_date','event_end_date','fin','f_fin','fechaHasta'));
  if(!start){d.missingDate++;d.missingEventDate++;if(val('start_date_registration','end_date_registration'))d.registrationDatesOnly++;continue;}
  if(start>to||(end||start)<from){d.outOfRange++;continue;}
  const location=e.ubicacion||e.location||e.lugar||{};
  const loc=typeof location==='object'&&location?location:{};
  const locAddress=typeof loc.address==='object'&&loc.address?loc.address:{};
  const city=tidy(val('municipio','localidad','poblacion','ciudad','municipality','nombreMunicipio','nombreLocalidad','town')||get(loc,['municipio','municipality','localidad','addressLocality','city','town'])||get(locAddress,['addressLocality','municipio','city']));
  const provinceRaw=val('provincia','nombreProvincia','nombre_provincia','province','provinciaNombre','province_code')||get(loc,['provincia','province','addressRegion'])||get(locAddress,['addressRegion','province']);
  const province=andaluciaProvince(provinceRaw);
  if(!province){d.unknownProvince++;d.missingPlace++;continue;}
  if(norm(province)!==norm(requestedProvince)){d.wrongProvince++;continue;}
  if(!city)d.missingPlace++;
  const linkValue=val('more_info_url','moreInfoUrl','url','enlace','enlace_evento','urlEvento','url_actividad','enlace_al_contenido','web','link','contentUrl','urlDetalle','url_detalle');
  const url=secureLink(linkValue);
  if(!url){d.missingLink++;continue;}
  const desc=tidy(val('descripcion','descripción','description','resumen','contenido','detalle'));
  const freeFlag=val('gratuito','gratuita','es_gratuito','esGratuito','freeAdmission','gratis');
  const hasFlag=freeFlag!=='';
  const cost=hasFlag?freeFlag:val('cost','precio','precioEntrada','precio_entrada','coste','tarifa','importe');
  const status=classify(cost,desc,title,hasFlag);
  const place=tidy(val('espacio','lugar_celebracion','lugarCelebracion','espacioNombre','nombreLugar','direccion','dirección','recinto')||get(loc,['nombre','name','lugar','direccion','address'])||get(locAddress,['streetAddress']))||city;
  const time=tidy(val('hora','hora_inicio','horaInicio','horario')).slice(0,36);
  const kinds=kindsFor(title,desc,tidy(val('categoria','categoría','tipo','tematica','temática')));
  out.push({title,start:start<from?from:start,end:end||'',city,province,place,time,kind:kinds[0],kinds,description:desc,source,url,freeType:status==='condicional'?'condicional':'confirmada',status});
  d.classified[status]++;d.accepted++;
 }
 return out;
}
async function readAndalucia(){
 const base='https://datos.juntadeandalucia.es/api/v0/schedule/all?format=';
 const attempts=[];
 for(const fmt of ['json','csv']){
  try{
   const dl=await readJob({parser:'andalucia-open-data',url:base+fmt,csv:fmt==='csv',allowEmpty:true});
   const items=andaluciaRows(dl.raw);
   // Una fuente que no devuelve registros reconocibles no se considera consulta satisfactoria.
   if(!items.length)throw Error('Respuesta sin registros reconocibles');
   return {...dl,format:fmt};
  }catch(e){attempts.push(fmt+': '+String(e?.message||e).slice(0,120));}
 }
 throw Error('La Junta no entregó registros reconocibles: '+attempts.join(' | '));
}

// Andalucía: proyección de SOLO LECTURA de los registros originales en D1.
// Clasificación editorial separada de la recolección. Los plazos de inscripción
// se tratan como fechas a verificar y nunca se declara gratuito por silencio.
export async function readAndaluciaD1(db,from,to,province,d){
 if(!db||typeof db.prepare!=='function')throw Error('Falta el binding ACTIVIDADES_DB');
 const provinceName=andaluciaProvince(province);
 if(!provinceName)return [];
 const result=await db.prepare(`
  SELECT e.evento_id,e.titulo,e.descripcion_html,e.tematica,e.categoria,
         e.precio_original,e.nombre_localidad,e.nombre_provincia,
         e.lugar_celebracion,e.enlace_contenido,
         s.fecha_inicio,s.fecha_fin,s.hora_inicio,
         e.datos_originales_json
  FROM sesiones s JOIN eventos e
   ON s.fuente_clave=e.fuente_clave AND s.evento_id=e.evento_id
  WHERE s.fuente_clave='junta-andalucia-agenda'
    AND e.nombre_provincia=? AND s.fecha_inicio<=?
    AND COALESCE(NULLIF(s.fecha_fin,''),s.fecha_inicio)>=?
  ORDER BY s.fecha_inicio,e.evento_id LIMIT 600
 `).bind(provinceName,to,from).all();
 const rows=result?.results||[];d.received=rows.length;
 d.excludedAdministrative=0;d.excludedUnclear=0;d.dateNeedsVerification=0;
 const out=[];
 const disallowed=/\b(?:premios?|convocatorias?|subvenciones?|ayudas?|becas?|licitaciones?|oposiciones?|oferta de empleo|inscripci[oó]n|presentaci[oó]n de candidaturas|jornada[s]? t[eé]cnicas?|riesgos laborales|prevenci[oó]n de riesgos|salud laboral|derecho del trabajo|empleabilidad|simposium|congreso profesional|formaci[oó]n y empleo|sostenibilidad empresarial)\b/i;
 const activity=/\b(?:exposici[oó]n|museo|festival|feria|concierto|m[uú]sica|teatro|cine|proyecci[oó]n|talleres?|visita[s]? guiadas?|ruta|senderismo|senda|paseo|patrimonio|puertas abiertas|cuentacuentos|infantil|familiar|familias|fiestas?|artesan[ií]a|mercadillo|danza|literatura|lectura|ferrocarril)\b/i;
 const seen=new Set();
 for(const row of rows){
  const title=tidy(row.titulo), city=tidy(row.nombre_localidad);
  if(!title){d.missingTitle++;continue;}
  if(disallowed.test(title)){d.excludedAdministrative++;continue;}
  const raw=(()=>{try{return JSON.parse(row.datos_originales_json||'{}')}catch{return {}}})();
  const desc=htmlText(row.descripcion_html||raw.description||'').slice(0,700);
  if(!activity.test(title+' '+tidy(row.categoria||'')+' '+tidy(row.tematica||''))){d.excludedUnclear++;continue;}
  if(!city){d.missingPlace++;continue;}
  const url=secureLink(row.enlace_contenido||raw.url||raw.more_info_url||raw.link);
  // Un enlace ausente no convierte una actividad real en inexistente.
  // No inventar un enlace individual: la web debe omitir el botón si url está vacío.
  if(!url)d.missingLink++;
  // La fuente denomina sus fechas date_registration; no inventamos confirmación.
  d.dateNeedsVerification++;
  const start=row.fecha_inicio<from?from:row.fecha_inicio;
  const unique=row.evento_id+'|'+start;
  if(seen.has(unique))continue;
  seen.add(unique);
  // SOLO señales explícitas de precio, no se usa el texto de la descripción
  // para declarar gratuidad si pudiera referirse a inscripciones o colectivos.
  const price=priceSignal(row.precio_original||raw.cost||'',false);
  const status=price==='free'?'gratis':price==='paid'?'pago':'pendiente';
  const kinds=kindsFor(title,desc,tidy(row.categoria||row.tematica||''));
  out.push({title,start,end:row.fecha_fin||'',city,province:provinceName,
   place:tidy(row.lugar_celebracion)||city,time:tidy(row.hora_inicio||raw.schedule||'').slice(0,36),
   kind:kinds[0],kinds,description:desc+' · Fecha por confirmar con la Junta.'+(!url?' · La fuente no facilita enlace individual para este registro.':''),
   source:'Junta de Andalucía · Agenda (D1)',url,missingOfficialLink:!url,
   freeType:status==='gratis'?'confirmada':'pendiente',status});
  d.classified[status]++;d.accepted++;
 }
 return out;
}

// CASTILLA Y LEÓN: consulta de solo lectura a los registros ya importados en D1.
// No se requiere enlace ni precio conocido para mostrar una actividad.
// Se conserva el valor original y no se inventan ni municipios ni URLs.
export async function readCastillaD1(db,from,to,province,d){
 if(!db||typeof db.prepare!=='function')throw Error('Falta el binding ACTIVIDADES_DB');
 const provinces=REGIONS.cyl.split('|');
 const provinceName=provinces.find(p=>norm(p)===norm(province));
 if(!provinceName)return [];
 const response=await db.prepare(`
  SELECT e.evento_id,e.titulo,e.descripcion_html,e.tematica,e.categoria,
         e.precio_original,e.nombre_localidad,e.nombre_provincia,
         e.lugar_celebracion,e.enlace_contenido,e.datos_originales_json,
         s.fecha_inicio,s.fecha_fin,s.hora_inicio
  FROM sesiones s JOIN eventos e
    ON s.fuente_clave=e.fuente_clave AND s.evento_id=e.evento_id
  WHERE s.fuente_clave='jcyl-agenda-cultural'
    AND e.nombre_provincia=? COLLATE NOCASE
    AND s.fecha_inicio<=?
    AND COALESCE(NULLIF(s.fecha_fin,''),s.fecha_inicio)>=?
  ORDER BY s.fecha_inicio,e.evento_id LIMIT 750
 `).bind(provinceName,to,from).all();
 const rows=response?.results||[];
 d.received=rows.length;d.sourceFormat='D1';d.endpoint='D1:apanate-actividades';
 const out=[],seen=new Set();
 for(const row of rows){
  const title=tidy(row.titulo),start=isoDate(row.fecha_inicio),end=isoDate(row.fecha_fin);
  if(!title){d.missingTitle++;continue;}
  if(!start){d.missingDate++;continue;}
  if(start>to||(end||start)<from){d.outOfRange++;continue;}
  const id=String(row.evento_id)+'|'+start;
  if(seen.has(id))continue;
  seen.add(id);
  const desc=htmlText(row.descripcion_html||'').slice(0,700);
  const city=tidy(row.nombre_localidad);
  const place=tidy(row.lugar_celebracion);
  if(!city&&!place)d.missingPlace++;
  const url=secureLink(row.enlace_contenido);
  if(!url)d.missingLink++;
  const signal=priceSignal(row.precio_original,false);
  const status=signal==='free'?'gratis':signal==='paid'?'pago':'pendiente';
  const kinds=kindsFor(title,desc,tidy(row.categoria||row.tematica||''));
  out.push({title,start:start<from?from:start,end:end||'',
   city:city||'Localidad no indicada',province:provinceName,
   place:place||'Lugar por confirmar',time:tidy(row.hora_inicio).slice(0,36),
   kind:kinds[0],kinds,description:desc,
   source:'Castilla y León · Agenda cultural (D1)',url,
   missingOfficialLink:!url,freeType:status==='gratis'?'confirmada':'pendiente',status});
  d.classified[status]++;d.accepted++;
 }
 return out;
}

// SEVILLA - fuentes oficiales HTML independientes de la Junta y de D1.
// No suponemos gratuidad, municipio ni fecha. Sin datos contrastables no publicamos.
// Esta lectura no escribe en D1 ni interfiere con el importador.
const SEVILLA_MONTHS={enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12};
function sevillaDates(txt){
 const values=[];
 // Priorizar fechas ISO declaradas en marcado HTML o en el contenido de las fichas.
 const iso=/(20\d\d)-(0[1-9]|1[012])-([012]\d|3[01])/g;
 for(const m of String(txt||'').matchAll(iso))values.push(m[0]);
 for(const m of String(txt||'').matchAll(/\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+(20\d{2})\b/gi)){
  const day=Number(m[1]),month=SEVILLA_MONTHS[norm(m[2])];
  const date=`${m[3]}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  if(new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date)values.push(date);
 }
 return [...new Set(values)];
}
function sevillaAbsolute(href,base,allowedHost){
 try{const u=new URL(String(href||'').replace(/&amp;/g,'&'),base);
  if(u.protocol!=='https:'||u.hostname!==allowedHost||!u.pathname.startsWith('/'))return '';
  u.hash='';return u.href;
 }catch{return ''}
}
function sevillaCandidates(html,job){
 const out=[],seen=new Set();
 const host=new URL(job.url).hostname;
 const pattern=job.parser==='sevilla-icas'?/\/agenda\/[^?#/]+\/?$/:/\/agenda-de-la-provincia\/[^?#/]+\/?$/;
 const tag=/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
 for(const m of String(html||'').matchAll(tag)){
  const url=sevillaAbsolute(m[1],job.url,host);
  if(!url||!pattern.test(new URL(url).pathname)||seen.has(url))continue;
  const title=htmlText(m[2]).trim();
  if(title.length<5||title.length>230||/^(?:ver todos|agenda|calendario|ir al|siguiente|anterior|volver|visitar web)$/i.test(title))continue;
  seen.add(url);
  const neighbor=htmlText(String(html).slice((m.index||0)+m[0].length,(m.index||0)+m[0].length+360));
  const locality=job.parser==='sevilla-diputacion'?neighbor.match(/Municipio\s*,\s*([^,]{2,70})\s*,\s*Temas/i)?.[1]||'':'';
  out.push({title,url,city:locality.trim()});
  if(out.length>=50)break;
 }
 return out;
}
function sevillaDetail(html,item,job,from,to){
 const body=String(html||'');
 // Los metadatos estructurados son preferibles a las fechas de publicación.
 const startMeta=body.match(/(?:itemprop=["']startDate["'][^>]*content=["']|["']startDate["']\s*:\s*["'])(20\d\d-\d\d-\d\d)/i)
  ||body.match(/(?:content=["']|datetime=["'])(20\d\d-\d\d-\d\d)[^"']*["'][^>]*itemprop=["']startDate["']/i);
 const endMeta=body.match(/(?:itemprop=["']endDate["'][^>]*content=["']|["']endDate["']\s*:\s*["'])(20\d\d-\d\d-\d\d)/i);
 // Contexto del bloque "Cuándo" (ICAS) o "Inicio" (Diputación), no toda la página:
 // fuera del bloque hay fechas de noticias y enlaces que NO son la actividad.
 const plain=htmlText(body).replace(/\s+/g,' ');
 const match=job.parser==='sevilla-icas'
  ?plain.match(/\bCu[aá]ndo\b\s*([^]{0,170}?)(?=\b(?:Espacio|Categor[ií]as|Venta de entradas|Web del Evento|Contacto|D[oó]nde)\b|$)/i)
  :plain.match(/\bInicio\s*:\s*([^]{0,130}?)(?=\b(?:Finalizaci[oó]n|HORA|Informaci[oó]n)\b|$)/i);
 const dates=sevillaDates(match?.[1]||'');
 const start=startMeta?.[1]||dates[0]||'';
 if(!start||start>to)return null;
 const endBlock=job.parser==='sevilla-diputacion'?plain.match(/\bFinalizaci[oó]n\s*:\s*([^]{0,85}?)(?=\b(?:HORA|Informaci[oó]n)\b|$)/i):null;
 const end=endMeta?.[1]||sevillaDates(endBlock?.[1]||'')[0]||dates[1]||'';
 if(end&&end<from)return null;
 if(!end&&start<from)return null;
 if(end&&end<start)return null;
 let city='';let place='';
 if(job.parser==='sevilla-icas'){
  city='Sevilla';
  const p=plain.match(/\bEspacio\s+(.{3,110}?)(?=\b(?:Categor[ií]as|Venta de entradas|Web del Evento|Contacto|Cu[aá]ndo)\b|$)/i);
  place=(p?.[1]||'').trim().slice(0,100);
 }else{
  // Nombre de municipio solo si está marcado en la ficha como enlace municipal.
  // No se asigna Sevilla capital a otros municipios de la provincia.
  const local=body.match(/<a\b[^>]*href=["'][^"']*\/municipios\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/i)
   ||body.match(/<a\b[^>]*>([\s\S]*?)<\/a>\s*\/\s*<a\b[^>]*>\s*(?:Cultura|Deportes)/i);
  city=htmlText(local?.[1]||'').trim().slice(0,90)||item.city||'';
  if(!city){const crumb=plain.match(/Del\s+\d{1,2}[^/]{0,100}\/\s*([^/]{3,65})\s*\/\s*(?:Cultura|Deportes|Temas)/i);city=(crumb?.[1]||'').trim();}
  // Municipio desconocido: no inventar capital.
  if(!city)return null;
 }
 const title=item.title;
 if(/\b(?:convocatoria|subvenci[oó]n|licitaci[oó]n|plazo de inscripci[oó]n|resoluci[oó]n)\b/i.test(title))return null;
 const priceText=plain.match(/(?:entrada\s+gratuita|entrada\s+libre|acceso\s+gratuito|gratuito|gratis|entradas?\s+desde\s+\d+[.,]?\d*\s*€|precio\s*:\s*\d+[.,]?\d*\s*€)/i)?.[0]||'';
 const signal=priceSignal(priceText,false);
 const status=signal==='free'?'gratis':signal==='paid'?'pago':'pendiente';
 const kinds=kindsFor(title,plain.slice(0,450),'cultura');
 return {title,start,end,city,province:'Sevilla',place:place||city,time:'',kind:kinds[0],kinds,
  description:`Agenda oficial · ${job.name}. Precio ${status==='pendiente'?'por confirmar':'indicado en la fuente'}.`,
  source:job.name,url:item.url,freeType:status==='gratis'?'confirmada':'pendiente',status};
}
export async function readSevillaAgenda(job,from,to,province,d){
 // ICAS es exclusivamente Sevilla capital; Diputación tiene municipios de toda la provincia.
 if(norm(province)!=='sevilla')return [];
 const html=await (await fetchTimed(job.url,'text/html',12000)).text();
 const candidates=sevillaCandidates(html,job);
 d.received=candidates.length;d.accepted=0;d.outOfRange=0;d.missingDate=0;d.missingPlace=0;
 d.sourceFormat='HTML';d.endpoint=job.url;
 if(!candidates.length)throw Error('La agenda oficial no presenta enlaces a fichas reconocibles; revisar el lector.');
 const results=[];
 // Límite para que una fuente lenta no bloquee todas las agendas.
 for(let i=0;i<Math.min(candidates.length,24);i+=6){
  const batch=await Promise.all(candidates.slice(i,i+6).map(async item=>{
   try{const detail=await (await fetchTimed(item.url,'text/html',9000)).text();
    return sevillaDetail(detail,item,job,from,to);
   }catch{return null}
  }));
  for(const event of batch){if(event){results.push(event);d.classified[event.status]++;d.accepted++;}}
 }
 return results;
}

// Consultar primero fechas vigentes. Si falla la consulta filtrada, usar
// alternativas conservando la comprobación estricta del municipio y período.
// Las páginas vacías terminan la paginación sin marcar fallo.
// Conservar SIEMPRE la primera respuesta con registros, aunque todos se descarten:
// un 0 en actividades aceptadas no equivale a un 0 recibido de la fuente.
// La consulta antigua se mantiene como alternativa para evitar regresiones.
async function readDibaMunicipal(job,from,to){
 const base='https://do.diba.cat/api/dataset/actesturisme_ca';
 const attempts=[];
 const queries=[
  {name:'fecha vigente',path:`camp-rel_municipis-like/${job.dibaCode}/camp-data_fi-greaterequal/${from}/ord-data_fi/asc`,paged:true},
  {name:'municipio sin filtro (original)',path:`camp-rel_municipis-like/${job.dibaCode}`,paged:false},
  {name:'municipio alternativo (original)',path:`camp-municipi_nom/${encodeURIComponent(job.municipio)}`,paged:false},
  {name:'municipio ordenado',path:`camp-rel_municipis-like/${job.dibaCode}/ord-data_fi/desc`,paged:true}
 ];
 const perPage=150,maxPages=4;
 let best=null,successfulQueries=0,failedQueries=0;
 for(let index=0;index<queries.length;index++){
  const query=queries[index],merged=[];let failure='',pages=0,complete=false;
  for(let page=0;page<(query.paged?maxPages:1);page++){
   const start=page*perPage+1,end=start+perPage-1;
   const url=`${base}/format/json/pag-ini/${start}/pag-fi/${end}/${query.path}`;
   try{
    const chunk=await readJob({parser:'municipal-barcelona',url,allowEmpty:true});
    const rows=municipalRecords(chunk.raw);
    merged.push(...rows);pages++;
    if(rows.length<perPage){complete=true;break;}
   }catch(error){failure=String(error?.message||error).slice(0,120);break;}
  }
  const usable=merged.some(row=>{
   const e=row?.properties||row?.fields||row;
   if(!e||!dibaMunicipalityMatches(e,job))return false;
   const first=isoDate(fieldValue(e,[/^datainici$/]));
   const last=isoDate(fieldValue(e,[/^datafi$/]))||first;
   return !!first&&first<=to&&last>=from;
  });
  if(pages)successfulQueries++;
  if(failure)failedQueries++;
  attempts.push(`${query.name}: ${merged.length} recibido(s)${failure?'; '+failure:''}`);
  // Guardar evidencia de la fuente aunque los filtros locales descarten todo.
  if(merged.length&&(!best||merged.length>best.raw.length)){
   best={raw:merged,endpoint:`${base}/${query.path}`,pages,partial:!complete||!!failure,
    warning:failure,queryFallback:index>0};
  }
  if(usable){
   return {raw:merged,endpoint:`${base}/${query.path}`,pages,partial:!complete||!!failure,
    warning:failure,queryFallback:index>0,sourceAttempts:attempts,failedQueries};
  }
 }
 if(best)return {...best,sourceAttempts:attempts,failedQueries,noValidDibaEvents:true};
 // Una consulta que responde vacía no es un error de red. Diagnosticarla como tal.
 if(successfulQueries)
  return {raw:[],endpoint:base,pages:0,partial:failedQueries>0,warning:failedQueries?'Algunas consultas fallaron; ver sourceAttempts':'Todas las consultas respondieron sin registros',sourceAttempts:attempts,failedQueries};
 throw new Error(attempts.join(' | ').slice(0,500));
}
async function readMunicipalBarcelona(job,from,to){
 if(job.municipalCsvUrl){
  try{
   const csv=await readJob({parser:'municipal-barcelona',csv:true,url:job.municipalCsvUrl});
   // Usar solo campos reales; nunca atribuir a la fuente municipal
   // nombres de la API provincial ni inventar URL de actividad.
   const fields=Object.keys(municipalRecords(csv.raw)[0]||{});
   const normalized=fields.map(norm).map(x=>x.replace(/[^a-z0-9]/g,''));
   const hasDate=normalized.some(x=>/^(datainici|datainicial|inicievent|startdate|fecha.*inicio)$/.test(x));
   const hasTitle=normalized.some(x=>/^(titol|titolactivitat|nomactivitat|nomacte|activitat|denominacio|nom|title|descripcio)$/.test(x));
   if(hasDate&&hasTitle){
    const preview={received:0,missingTitle:0,missingDate:0,outOfRange:0,missingPlace:0,wrongProvince:0,missingLink:0,accepted:0,classified:{gratis:0,condicional:0,pendiente:0,pago:0}};
    const parsed=municipalBarcelonaEvents(csv.raw,from,to,{...job,hospitaletCsv:true},preview);
    if(parsed.length)return {...csv,municipalCsv:true};
   }
  }catch(_){ /* La fuente municipal puede cambiar: conservar alternativa provincial. */ }
 }
 return readDibaMunicipal(job,from,to);
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=180, s-maxage=600','x-content-type-options':'nosniff'}})}
export async function onRequestGet({request,env={}}){
 const p=new URL(request.url).searchParams;const province=tidy(p.get('province')).slice(0,80),city=tidy(p.get('city')).slice(0,80);const from=p.get('from')||'',to=p.get('to')||'';
 if(!province||!/^20\d\d-\d\d-\d\d$/.test(from)||!/^20\d\d-\d\d-\d\d$/.test(to)||to<from||(Date.parse(to)-Date.parse(from))/864e5>45)return json({events:[],notice:'Elige provincia y hasta 45 días.'},400);
 const region=Object.keys(REGIONS).find(k=>REGIONS[k].split('|').some(n=>norm(n)===norm(province)));
 const jobs=[...(SOURCE[region]||[])].filter(j=>!['sevilla-icas','sevilla-diputacion'].includes(j.parser)||norm(province)==='sevilla');
 if(norm(province)==='madrid')jobs.push(...SOURCE.madrid);
 if(norm(province)==='barcelona')jobs.push(...SOURCE.barcelona,...SOURCE.barcelonaMunicipios);
 if(norm(province)==='zaragoza')jobs.push(...SOURCE.zaragoza);
 if(norm(province)==='malaga')jobs.push(...SOURCE.malaga);
 if(norm(province)==='asturias')jobs.push(...SOURCE.gijon);
 if(!jobs.length)return json({events:[],stats:null,sources:[],failed:false,notice:'Aún no hay una API de actividades gratuitas conectada para esta provincia. Estamos ampliando ayuntamientos, diputaciones y asociaciones; no significa que no existan planes.'});
 const settled=await Promise.all(jobs.map(async j=>{
   const diagnostic={received:0,missingTitle:0,missingDate:0,outOfRange:0,missingPlace:0,wrongProvince:0,missingLink:0,accepted:0,classified:{gratis:0,condicional:0,pendiente:0,pago:0}};
   try{
    if(j.parser==='cyl-d1'){
      diagnostic.sourceFormat='D1';diagnostic.endpoint='D1:apanate-actividades';
      diagnostic.bindingPresent=!!(env.ACTIVIDADES_DB&&typeof env.ACTIVIDADES_DB.prepare==='function');
      if(!diagnostic.bindingPresent)throw Error('Falta ACTIVIDADES_DB en Pages Functions');
      const events=await readCastillaD1(env.ACTIVIDADES_DB,from,to,province,diagnostic);
      return {name:j.name,ok:true,events,diagnostic,endpoint:'D1:apanate-actividades'};
    }
    if(j.parser==='andalucia-open-data'){
      // Andalucía utiliza exclusivamente la base D1 ya importada.
      // Nunca disimular un binding ausente recurriendo a la API antigua.
      diagnostic.sourceFormat='D1';
      diagnostic.endpoint='D1:apanate-actividades';
      diagnostic.bindingPresent=!!(env.ACTIVIDADES_DB && typeof env.ACTIVIDADES_DB.prepare==='function');
      if(!diagnostic.bindingPresent){
        throw new Error('ACTIVIDADES_DB no está disponible en esta ejecución de Pages Functions. Verifica el binding D1 en Production y publica un despliegue nuevo.');
      }
      const events=await readAndaluciaD1(env.ACTIVIDADES_DB,from,to,province,diagnostic);
      return {name:j.name,ok:true,events,diagnostic,endpoint:'D1:apanate-actividades'};
    }
    if(j.parser==='sevilla-icas'||j.parser==='sevilla-diputacion'){
      const events=await readSevillaAgenda(j,from,to,province,diagnostic);
      return {name:j.name,ok:true,events,diagnostic,endpoint:j.url};
    }
    if(j.parser==='barcelona-html'){
      const result=await readBarcelonaHtml(j,from,to);
      diagnostic.fields=result.debug||`Fichas con enlace detectadas: ${result.received}`;diagnostic.received=result.received;diagnostic.outOfRange=result.outOfRange;diagnostic.missingDate=result.missingDate||0;diagnostic.accepted=result.events.length;
      for(const ev of result.events)diagnostic.classified[ev.status]++;
      return {name:j.name,ok:true,events:result.events,diagnostic,endpoint:j.url};
    }
    if(j.parser==='catalonia-json'||j.parser==='catalonia-csv'){
      const source=await readCatalonia(j,from,to);
      const events=cataloniaEvents(source.raw,from,to,j.name,diagnostic);
      diagnostic.pages=source.pages;diagnostic.paginationPartial=source.partial;diagnostic.sourceFormat=source.format;
      diagnostic.queryCounts=source.queryCounts;diagnostic.queryDuplicates=source.queryDuplicates;diagnostic.queryRepeated=source.queryRepeated;
      return {name:j.name,ok:true,events,diagnostic,endpoint:source.endpoint};
    }
    if(j.parser==='municipal-barcelona'){
      const downloaded=j.dibaCode?await readMunicipalBarcelona(j,from,to):await readJob(j);
      const events=municipalBarcelonaEvents(downloaded.raw,from,to,{...j,hospitaletCsv:!!downloaded.municipalCsv},diagnostic);
      if(downloaded.pages)diagnostic.pages=downloaded.pages;
      if(downloaded.sourceAttempts)diagnostic.sourceAttempts=downloaded.sourceAttempts;
      if(downloaded.failedQueries)diagnostic.failedQueries=downloaded.failedQueries;
      if(downloaded.noValidDibaEvents)diagnostic.noValidDibaEvents=true;
      if(downloaded.queryFallback)diagnostic.queryFallback=true;
      if(downloaded.partial)diagnostic.paginationPartial=true;
      if(downloaded.warning)diagnostic.sourceWarning=downloaded.warning;
      diagnostic.endpoint=downloaded.endpoint;
      return {name:j.name,ok:true,events,diagnostic,endpoint:downloaded.endpoint};
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
 const paginationFailures=settled.filter(x=>x.diagnostic?.paginationPartial).length;
 const isMadrid=norm(province)==='madrid';
 const isPilot=isMadrid||norm(province)==='barcelona'||region==='andalucia'||region==='cyl';
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
 const checked=all.sort(sortEvents);
 const type=p.get('type')||'todos';
 const selected=['cultura','ferias','fiestas','familia'].includes(type)?checked.filter(e=>eventKinds(e).includes(type)):checked;
 const pageSize=24;
 const offset=Math.min(20000,Math.max(0,Number.parseInt(p.get('offset')||'0',10)||0));
 const events=selected.slice(offset,offset+pageSize);
 const displayed=events.length,confirmed=checked.length;
 const working=[...new Set(settled.filter(x=>x.ok).map(x=>x.name))];const failures=settled.filter(x=>!x.ok).length+settled.reduce((n,x)=>n+(x.pageErrors||0),0);
 return json({events,displayed,confirmed,requestedType:type,stats:working.length===0?null:stats,sources:working,sourceCount:jobs.length,failed:working.length===0,partial:failures>0||paginationFailures>0,
  pagination:{offset,limit:pageSize,total:selected.length,hasMore:offset+displayed<selected.length},
  deduplication:{duplicates,conflicts},
  diagnostic:isPilot?settled.map(({name,ok,diagnostic,error,pageErrors})=>({name,ok,...diagnostic,...(pageErrors?{error:`${pageErrors} página(s) de la agenda autonómica no respondieron`}:{}),...(error?{error}: {})})):undefined,
  notice:working.length===0?'No ha respondido ninguna fuente. No hay datos suficientes para contar actividades.':(failures||paginationFailures)?`Consulta parcial: ${failures} fuente(s) sin respuesta y ${paginationFailures} fuente(s) con paginación incompleta.`:events.length?'':'No hay actividades identificadas en las fuentes consultadas para este periodo.'});
}
