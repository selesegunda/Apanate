/* ¡Apáñate! · Efemérides astronómicas. Posiciones calculadas previamente con Swiss Ephemeris (Moshier).
   Horarios locales aproximados por capital provincial; no depende de buscadores ni de servicios de terceros. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const province=$('astro-provincia'),city=$('astro-municipio'),output=$('astro-resultados');
if(!province||!output)return;
const places=[
['Álava','Vitoria-Gasteiz',42.847,-2.672],['Albacete','Albacete',38.995,-1.856],['Alicante','Alicante',38.345,-0.482],['Almería','Almería',36.835,-2.464],['Asturias','Oviedo',43.361,-5.849],['Ávila','Ávila',40.657,-4.681],['Badajoz','Badajoz',38.879,-6.970],['Barcelona','Barcelona',41.388,2.170],['Bizkaia','Bilbao',43.263,-2.935],['Burgos','Burgos',42.343,-3.696],['Cáceres','Cáceres',39.476,-6.372],['Cádiz','Cádiz',36.529,-6.292],['Cantabria','Santander',43.462,-3.810],['Castellón','Castelló de la Plana',39.986,-0.037],['Ciudad Real','Ciudad Real',38.986,-3.929],['Córdoba','Córdoba',37.884,-4.779],['A Coruña','A Coruña',43.362,-8.412],['Cuenca','Cuenca',40.070,-2.137],['Gipuzkoa','Donostia-San Sebastián',43.318,-1.981],['Girona','Girona',41.979,2.821],['Granada','Granada',37.177,-3.599],['Guadalajara','Guadalajara',40.630,-3.167],['Huelva','Huelva',37.261,-6.945],['Huesca','Huesca',42.136,-0.408],['Illes Balears','Palma',39.570,2.650],['Jaén','Jaén',37.779,-3.785],['La Rioja','Logroño',42.466,-2.447],['Las Palmas','Las Palmas de Gran Canaria',28.124,-15.436],['León','León',42.598,-5.567],['Lleida','Lleida',41.616,0.622],['Lugo','Lugo',43.013,-7.555],['Madrid','Madrid',40.417,-3.703],['Málaga','Málaga',36.721,-4.421],['Murcia','Murcia',37.992,-1.130],['Navarra','Pamplona',42.817,-1.644],['Ourense','Ourense',42.336,-7.858],['Palencia','Palencia',42.009,-4.529],['Pontevedra','Pontevedra',42.431,-8.644],['Salamanca','Salamanca',40.970,-5.664],['Santa Cruz de Tenerife','Santa Cruz de Tenerife',28.463,-16.251],['Segovia','Segovia',40.943,-4.108],['Sevilla','Sevilla',37.389,-5.984],['Soria','Soria',41.764,-2.468],['Tarragona','Tarragona',41.118,1.245],['Teruel','Teruel',40.344,-1.107],['Toledo','Toledo',39.858,-4.024],['Valencia','València',39.470,-0.376],['Valladolid','Valladolid',41.652,-4.729],['Zamora','Zamora',41.504,-5.744],['Zaragoza','Zaragoza',41.650,-0.887],['Ceuta','Ceuta',35.889,-5.319],['Melilla','Melilla',35.291,-2.938]];
places.sort((a,b)=>a[0].localeCompare(b[0],'es'));for(const p of places){const o=document.createElement('option');o.value=o.textContent=p[0];province.append(o)}
const contacts={
'Madrid':[['Agrupación Astronómica de Madrid','https://www.aam.org.es/']],
'Asturias':[['Asociaciones asturianas · Federación Astronómica','https://federacionastronomica.es/federacion/asociaciones']],
'Granada':[['Instituto de Astrofísica de Andalucía · CSIC','https://www.iaa.csic.es/']],
'Sevilla':[['Astronomía Sevilla','https://www.astronomiasevilla.org/']],
'Málaga':[['Sociedad Malagueña de Astronomía','https://www.astromalaga.es/']],
'Barcelona':[['ASTER · Barcelona','https://aster.cat/']],
'Zaragoza':[['Agrupación Astronómica Aragonesa','https://www.astroaragonesa.org/']],
'Guadalajara':[['Centro Astronómico de Yebes · IGN','https://www.ign.es/web/ign/portal/ic-visitas']],
'Santa Cruz de Tenerife':[['Instituto de Astrofísica de Canarias','https://www.iac.es/es/divulgacion/visitas']],
'Las Palmas':[['Instituto de Astrofísica de Canarias','https://www.iac.es/es/divulgacion/visitas']]
};
const common=[['Federación de Asociaciones Astronómicas de España','https://federacionastronomica.es/federacion/asociaciones'],['Observatorio Astronómico Nacional · IGN','https://astronomia.ign.es/'],['Instituto de Astrofísica de Canarias y visitas','https://www.iac.es/es/divulgacion/visitas'],['Instituto de Astrofísica de Andalucía · CSIC','https://www.iaa.csic.es/']];
let db=null;const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short'}).format(new Date(x+'T12:00:00Z'));
const localISO=(date,tz)=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const addDays=(iso,n)=>{let d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
function tzOffset(date,tz){const s=new Intl.DateTimeFormat('en',{timeZone:tz,timeZoneName:'shortOffset'}).formatToParts(date).find(x=>x.type==='timeZoneName')?.value||'GMT';const m=s.match(/GMT([+-])(\d{1,2})(?::(\d\d))?/);return m?(m[1]==='-'?-1:1)*(Number(m[2])*60+Number(m[3]||0)):0}
function localDate(iso,h,m,tz){const utc=Date.parse(iso+'T00:00:00Z')+(h*60+m)*60000;const o=tzOffset(new Date(utc),tz);return new Date(utc-o*60000)}
function skyAlt(ra,dec,when,lat,lon){const jd=when.getTime()/86400000+2440587.5;const gmst=((280.46061837+360.98564736629*(jd-2451545))%360+360)%360;const H=(gmst+lon-ra)*Math.PI/180;const latR=lat*Math.PI/180,decR=dec*Math.PI/180;return Math.asin(Math.sin(latR)*Math.sin(decR)+Math.cos(latR)*Math.cos(decR)*Math.cos(H))*180/Math.PI}
function sol(iso,lat,lon,rise,tz){const d=new Date(iso+'T12:00:00Z');const year=d.getUTCFullYear(), N=Math.floor((d.getTime()-Date.UTC(year,0,1))/86400000)+1;const t=N+((rise?6:18)-lon/15)/24;const M=.9856*t-3.289;const deg=Math.PI/180;const n=a=>(a%360+360)%360;const L=n(M+1.916*Math.sin(M*deg)+.020*Math.sin(2*M*deg)+282.634);let RA=n(Math.atan(.91764*Math.tan(L*deg))/deg);RA+=(Math.floor(L/90)-Math.floor(RA/90))*90;RA/=15;const sinD=.39782*Math.sin(L*deg),cosD=Math.sqrt(1-sinD*sinD);const cosH=(Math.cos(90.833*deg)-sinD*Math.sin(lat*deg))/(cosD*Math.cos(lat*deg));if(Math.abs(cosH)>1)return '—';let H=Math.acos(cosH)/deg;if(rise)H=360-H;const hour=(H/15+RA-.06571*t-6.622)-lon/15;const when=new Date(Date.parse(iso+'T00:00:00Z')+hour*3600000);return new Intl.DateTimeFormat('es-ES',{timeZone:tz,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(when)}
const names=['Mercurio','Venus','Marte','Júpiter','Saturno','Urano','Neptuno'];
function visiblePlanets(record,iso,place,tz){const [,capital,lat,lon]=place;let found=[];
 const samples=[['Al anochecer',20,30,0],['Durante la noche',23,30,0],['Antes del amanecer',5,30,1]];
 for(let i=0;i<names.length;i++){
  const body=record.p[i];const periods=[];
  for(const [label,h,m,add] of samples){const when=localDate(addDays(iso,add),h,m,tz);const d=add?db.daily[addDays(iso,add)]||record:record;const sunAlt=skyAlt(...d.s.slice(0,2),when,lat,lon);const alt=skyAlt(...(d.p[i]||body).slice(0,2),when,lat,lon);
    if(sunAlt< -6 && alt>=10)periods.push(label);
  }
  if(periods.length)found.push({name:names[i],times:periods.join(' · '),equipment:i>=5?'Necesita prismáticos o telescopio':'A simple vista si el cielo acompaña',magnitude:body[2],...riseSetApprox(iso,lat,lon,tz,body)});
 }
 return found;
}
// Horarios orientativos de cruce del horizonte (no reemplazan efemérides topocéntricas).
function riseSetApprox(iso,lat,lon,tz,coords){
 if(!Array.isArray(coords)||coords.length<2)return {rise:'—',set:'—'};
 let rise=null,set=null,previous=null;
 for(let minutes=0;minutes<=1440;minutes+=10){
  const when=localDate(iso,0,minutes,tz);
  const altitude=skyAlt(coords[0],coords[1],when,lat,lon);
  if(previous!==null){
   if(previous<0&&altitude>=0&&rise===null)rise=minutes;
   if(previous>=0&&altitude<0&&set===null)set=minutes;
  }
  previous=altitude;
 }
 const clock=v=>v===null?'—':`${String(Math.floor(v/60)%24).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;
 return {rise:clock(rise),set:clock(set)};
}
function links(){const list=[...(contacts[province.value]||[]),...common];const seen=new Set();$('astro-local-contacts').innerHTML=list.filter(([n,u])=>!seen.has(u)&&seen.add(u)).map(([n,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(n)} ↗</a>`).join('')}
function eventCard(e,iso){const when=e.date===iso?'HOY':fmt(e.date);const badges={meteor:'Lluvia de estrellas',planeta:'Planetas',conjuncion:'Encuentro celeste',luna:'Luna',sol:'Sol'};return `<article class="sky-event"><span class="sky-when ${e.date===iso?'sky-now':''}">${when}</span><span class="sky-category">${esc(badges[e.type]||'Fenómeno')}</span><h4>${esc(e.title)}</h4><p>${esc(e.detail)}</p></article>`}
function update(){if(!province.value){const main=$('province');if(main?.value&&places.some(p=>p[0]===main.value))province.value=main.value;}const place=places.find(p=>p[0]===province.value);links();if(!db){output.innerHTML='<p class="sky-no-events">Preparando las efemérides…</p>';return}
 const tz=place&&['Las Palmas','Santa Cruz de Tenerife'].includes(place[0])?'Atlantic/Canary':'Europe/Madrid'; const today=localISO(new Date(),tz); const weekEnd=addDays(today,6); const monthEnd=addDays(today,29);
 let events=db.events.filter(e=>e.date>=today&&e.date<=monthEnd); const todayEvents=events.filter(e=>e.date===today); const weekEvents=events.filter(e=>e.date>today&&e.date<=weekEnd); const future=events.filter(e=>e.date>weekEnd);
 let html=`<div class="sky-alert ${todayEvents.length?'sky-alert-hot':''}" id="astro-hoy"><span class="eyebrow">LO QUE PASA HOY · ${esc(fmt(today))}</span><h3>${todayEvents.length?'¡Mira al cielo esta noche!':'Hoy también hay cielo que descubrir'}</h3>${todayEvents.length?`<div class="sky-event-list">${todayEvents.map(e=>eventCard(e,today)).join('')}</div>`:'<p>Hoy no coincide con un máximo o un fenómeno extraordinario de nuestro calendario. Consulta los próximos días y los planetas visibles.</p>'}</div>`;
 html+=`<div class="sky-next" id="astro-semana"><span class="eyebrow">ESTA SEMANA · DEL ${esc(fmt(today))} AL ${esc(fmt(weekEnd))}</span><h3>Lo próximo, sin que se te escape nada</h3><div class="sky-event-list">${weekEvents.length?weekEvents.map(e=>eventCard(e,today)).join(''):'<p>No hay fenómenos destacados fechados en los próximos siete días.</p>'}</div></div>`;
 html+=`<div class="sky-next sky-month"><span class="eyebrow">PRÓXIMOS 30 DÍAS</span><h3>Algo más adelante</h3><div class="sky-event-list">${future.length?future.map(e=>eventCard(e,today)).join(''):'<p>No hay otros máximos o encuentros destacados para este periodo.</p>'}</div></div>`;
 if(place){const [,capital,lat,lon]=place;const rec=db.daily[today];if(rec){const planetList=visiblePlanets(rec,today,place,tz);html+=`<div class="sky-local"><span class="eyebrow">TU CIELO · ${esc(province.value)}</span><h3>¿Qué planetas puedes ver?</h3><p>Visibilidad orientativa para hoy desde ${esc(capital)}. ${city.value.trim()&&city.value.trim().toLowerCase()!==capital.toLowerCase()?'Si tu localidad es otra, usamos la capital provincial como referencia.':''} Sin contaminación lumínica ni nubes.</p><div class="sky-planet-grid">${planetList.length?planetList.map(p=>`<div class="sky-planet"><strong>${esc(p.name)}</strong><p>${esc(p.times)}</p><p>Sale ≈ ${esc(p.rise)} · Se pone ≈ ${esc(p.set)}</p><small>${esc(p.equipment)}</small></div>`).join(''):'<p>No hemos calculado ningún planeta por encima de 10° de altura en nuestras tres franjas de observación. No significa que ninguno pueda verse a otra hora.</p>'}</div><div class="sky-chiprow"><span class="sky-chip">☀️ Sale el Sol: ${esc(sol(today,lat,lon,true,tz))}</span><span class="sky-chip">🌇 Se pone: ${esc(sol(today,lat,lon,false,tz))}</span><span class="sky-chip">🌙 Luna: ${rec.m[2]}% iluminada aprox.</span><span class="sky-chip">🌙 Sale ≈ ${esc(riseSetApprox(today,lat,lon,tz,rec.m).rise)}</span><span class="sky-chip">🌙 Se pone ≈ ${esc(riseSetApprox(today,lat,lon,tz,rec.m).set)}</span></div><p class="sky-small">Horas de salida y puesta de Luna y planetas aproximadas desde la capital provincial (coordenadas diarias a las 12 UTC; sin corrección por relieve ni refracción). «—» indica que no se ha detectado cruce en el día civil local. Posiciones de planetas calculadas para las 12 UTC: estimación orientativa de observabilidad en tres franjas (20:30, 23:30 y 05:30). Mercurio y Venus pueden tener ventanas muy breves cerca del horizonte; antes de ir consulta nubosidad y condiciones reales.</p></div>`}}
 else html+=`<div class="sky-local"><h3>¿Qué planetas se ven desde tu zona?</h3><p>Elige tu provincia en la ventana bonita de arriba. Calcularemos el cielo tomando como referencia su capital, sin pedir GPS.</p></div>`;
 html+=`<p class="sky-small">Calendario calculado con efemérides planetarias (Swiss Ephemeris/Moshier) y máximos habituales de lluvias. Incluye fases, conjunciones cercanas, oposiciones, elongaciones y solsticios/equinoccios; <strong>no es un catálogo exhaustivo de eclipses, ocultaciones ni todos los fenómenos menores</strong>. Los picos de meteoros son aproximados; confirma horarios de observación en el <a href="https://astronomia.ign.es/" target="_blank" rel="noopener noreferrer">Observatorio Astronómico Nacional</a>.</p>`;
 output.innerHTML=html;
}
document.querySelectorAll('[data-astro-jump]').forEach(button=>button.addEventListener('click',()=>{update();document.getElementById(button.dataset.astroJump)?.scrollIntoView({behavior:'smooth',block:'start'});}));province.addEventListener('change',()=>{links();update()});$('astro-consultar')?.addEventListener('click',()=>{update();document.getElementById('astro-resultados')?.scrollIntoView({behavior:'smooth',block:'start'});});city.addEventListener('change',update);
try{const pref=JSON.parse(localStorage.getItem('apanate-planes-preferencia-v2')||'{}');if(pref.province&&places.some(p=>p[0]===pref.province)){province.value=pref.province;city.value=pref.city||''}}catch(_){}
links();output.innerHTML='<p class="sky-no-events">Preparando el calendario astronómico…</p>';
fetch('/planes-gratis/cielo-calendario.json').then(r=>{if(!r.ok)throw Error('Calendario no disponible');return r.json()}).then(v=>{db=v;update()}).catch(()=>{output.innerHTML='<p class="sky-no-events">No hemos podido cargar el calendario astronómico. Comprueba que has subido <code>cielo-calendario.json</code> a GitHub.</p>'});
})();
