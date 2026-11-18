"use strict";
(() => {
  const $ = id => document.getElementById(id);
  // Coordenadas orientativas de capitales de provincia o ciudades autónomas.
  // No son datos GPS de la persona usuaria y no solicitan permisos de ubicación.
  const places = [
    ['Álava','Vitoria-Gasteiz',42.847,-2.672],['Albacete','Albacete',38.995,-1.856],
    ['Alicante','Alicante',38.345,-0.482],['Almería','Almería',36.835,-2.464],
    ['Asturias','Oviedo',43.361,-5.849],['Ávila','Ávila',40.657,-4.681],
    ['Badajoz','Badajoz',38.879,-6.970],['Barcelona','Barcelona',41.388,2.170],
    ['Bizkaia','Bilbao',43.263,-2.935],['Burgos','Burgos',42.343,-3.696],
    ['Cáceres','Cáceres',39.476,-6.372],['Cádiz','Cádiz',36.529,-6.292],
    ['Cantabria','Santander',43.462,-3.810],['Castellón','Castelló de la Plana',39.986,-0.037],
    ['Ciudad Real','Ciudad Real',38.986,-3.929],['Córdoba','Córdoba',37.884,-4.779],
    ['A Coruña','A Coruña',43.362,-8.412],['Cuenca','Cuenca',40.070,-2.137],
    ['Gipuzkoa','Donostia-San Sebastián',43.318,-1.981],['Girona','Girona',41.979,2.821],
    ['Granada','Granada',37.177,-3.599],['Guadalajara','Guadalajara',40.630,-3.167],
    ['Huelva','Huelva',37.261,-6.945],['Huesca','Huesca',42.136,-0.408],
    ['Illes Balears','Palma',39.570,2.650],['Jaén','Jaén',37.779,-3.785],
    ['La Rioja','Logroño',42.466,-2.447],['Las Palmas','Las Palmas de Gran Canaria',28.124,-15.436],
    ['León','León',42.598,-5.567],['Lleida','Lleida',41.616,0.622],
    ['Lugo','Lugo',43.013,-7.555],['Madrid','Madrid',40.417,-3.703],
    ['Málaga','Málaga',36.721,-4.421],['Murcia','Murcia',37.992,-1.130],
    ['Navarra','Pamplona',42.817,-1.644],['Ourense','Ourense',42.336,-7.863],
    ['Palencia','Palencia',42.009,-4.529],['Pontevedra','Pontevedra',42.431,-8.644],
    ['Salamanca','Salamanca',40.970,-5.664],['Santa Cruz de Tenerife','Santa Cruz de Tenerife',28.463,-16.251],
    ['Segovia','Segovia',40.943,-4.108],['Sevilla','Sevilla',37.389,-5.984],
    ['Soria','Soria',41.764,-2.468],['Tarragona','Tarragona',41.118,1.245],
    ['Teruel','Teruel',40.344,-1.107],['Toledo','Toledo',39.858,-4.024],
    ['Valencia','València',39.470,-0.376],['Valladolid','Valladolid',41.652,-4.729],
    ['Zamora','Zamora',41.504,-5.744],['Zaragoza','Zaragoza',41.650,-0.887],
    ['Ceuta','Ceuta',35.889,-5.319],['Melilla','Melilla',35.291,-2.938]
  ];
  const province = $('astro-provincia');
  const panel = $('astro-panel');
  const output = $('astro-resultados');
  const feedback = $('astro-alert');
  const toggle = $('astro-button');
  if (!province || !panel || !output || !feedback || !toggle) return;
  places.sort((a,b) => a[0].localeCompare(b[0],'es'));
  for (const [name] of places) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    province.appendChild(option);
  }

  function openPanel() {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded','true');
    panel.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
    province.focus({preventScroll:true});
  }
  toggle.addEventListener('click',openPanel);
  const suggestion = $('astro-suggestion');
  if (suggestion) suggestion.addEventListener('click',openPanel);
  const zonedDate = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const get = type => Number(parts.find(p=>p.type===type).value);
    return [get('year'),get('month'),get('day')];
  };
  const iso = (y,m,d) => `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const dayOnly = (date,timeZone) => new Date(Date.UTC(...zonedDate(date,timeZone).map((v,i)=>i===1?v-1:v)));
  const dayText = date => new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',weekday:'short',day:'numeric',month:'short'}).format(date);
  const longText = date => new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'}).format(date);
  const clock = (date, timeZone) => date ? new Intl.DateTimeFormat('es-ES',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date) : '—';

  // Algoritmo solar aproximado adaptado de las ecuaciones NOAA (cénit 90.833°).
  function solarEvent(date,lat,lon,isRise) {
    const year=date.getUTCFullYear();
    const jan1=Date.UTC(year,0,1);
    const N=Math.round((date.getTime()-jan1)/86400000)+1;
    const longitudeHour=lon/15;
    const t=N+((isRise?6:18)-longitudeHour)/24;
    const M=(0.9856*t)-3.289;
    const rad=Math.PI/180;
    const sin=d=>Math.sin(d*rad), cos=d=>Math.cos(d*rad);
    const normalize=d=>(d%360+360)%360;
    const L=normalize(M+1.916*sin(M)+.020*sin(2*M)+282.634);
    let RA=normalize(Math.atan(0.91764*Math.tan(L*rad))/rad);
    RA=RA+(Math.floor(L/90)*90-Math.floor(RA/90)*90);
    RA/=15;
    const sinDec=.39782*sin(L);
    const cosDec=Math.cos(Math.asin(sinDec));
    const cosH=(cos(90.833)-sinDec*sin(lat))/(cosDec*cos(lat));
    if(cosH>1 || cosH< -1) return null;
    let H=Math.acos(cosH)/rad;
    if(isRise) H=360-H;
    H/=15;
    const T=H+RA-.06571*t-6.622;
    const UT=T-longitudeHour;
    return new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())+UT*3600000);
  }
  // Luna: ciclo medio anclado en luna nueva del 9-11-2026 a las 07:02 UTC.
  // La fase es orientativa; no es una efeméride astronómica de alta precisión.
  const newMoonAnchor=Date.UTC(2026,10,9,7,2);
  const cycle=29.530588853;
  function lunar(date) {
    const days=(date.getTime()-newMoonAnchor)/86400000;
    const age=((days%cycle)+cycle)%cycle;
    const light=Math.round((1-Math.cos(2*Math.PI*age/cycle))*50);
    const labels=[
      [1.85,'🌑 Luna nueva'],[5.55,'🌒 Creciente fina'],[9.25,'🌓 Cuarto creciente'],[12.9,'🌔 Gibosa creciente'],
      [16.6,'🌕 Luna llena'],[20.3,'🌖 Gibosa menguante'],[24,'🌗 Cuarto menguante'],[27.7,'🌘 Menguante fina'],[30,'🌑 Luna nueva']
    ];
    return {age,light,label:labels.find(([max])=>age<max)[1]};
  }

  // Picos habituales, no pronóstico de visibilidad ni de actividad observada.
  // Datos de referencia: calendarios IMO/IGN; el máximo puede variar de año a año.
  const showers=[
    {name:'Cuadrántidas',month:1,day:3,note:'Suelen favorecer las horas antes del amanecer.'},
    {name:'Líridas',month:4,day:22,note:'Busca cielo oscuro y horizonte despejado.'},
    {name:'Eta Acuáridas',month:5,day:6,note:'Mejor cerca de la madrugada, especialmente desde latitudes más bajas.'},
    {name:'Delta Acuáridas',month:7,day:30,note:'Se observan mejor en plena noche desde un lugar oscuro.'},
    {name:'Perseidas',month:8,day:12,note:'Una de las lluvias de meteoros más populares del verano.'},
    {name:'Oriónidas',month:10,day:21,note:'Interesantes en horas de madrugada.'},
    {name:'Leónidas',month:11,day:18,note:'Suelen favorecer la segunda mitad de la noche.'},
    {name:'Gemínidas',month:12,day:14,note:'Su actividad suele disfrutarse durante la noche.'},
    {name:'Úrsidas',month:12,day:22,note:'Visibles principalmente desde el hemisferio norte.'}
  ];
  function weeklyShowers(start,end) {
    const found=[];
    const y=start.getUTCFullYear();
    for(let year=y-1;year<=y+1;year++) for(const item of showers) {
      const peak=new Date(Date.UTC(year,item.month-1,item.day,12));
      if(peak>=new Date(start.getTime()-2*86400000) && peak<=new Date(end.getTime()+2*86400000)) found.push({item,peak});
    }
    return found;
  }
  const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render() {
    const place=places.find(p=>p[0]===province.value);
    if(!place) { feedback.textContent='Elige una provincia para ver tu semana astronómica.';output.hidden=true;province.focus();return; }
    feedback.textContent='';
    const [name,capital,lat,lon]=place;
    const tz=name==='Las Palmas'||name==='Santa Cruz de Tenerife' ? 'Atlantic/Canary' : 'Europe/Madrid';
    const today=dayOnly(new Date(),tz);
    const weekday=today.getUTCDay();
    const monday=new Date(today.getTime()-((weekday+6)%7)*86400000);
    const sunday=new Date(monday.getTime()+6*86400000);
    const dates=Array.from({length:7},(_,i)=>new Date(monday.getTime()+i*86400000));
    const moonNow=lunar(new Date(today.getTime()+12*3600000));
    const sunset=solarEvent(today,lat,lon,false);
    const sunrise=solarEvent(today,lat,lon,true);
    const showerItems=weeklyShowers(monday,sunday);
    const events=[];
    for(const date of dates) {
      const a=lunar(new Date(date.getTime()+12*3600000)).age;
      const prev=lunar(new Date(date.getTime()-12*3600000)).age;
      const phaseNames=[{x:0,title:'Luna nueva',icon:'🌑'},{x:cycle/4,title:'Cuarto creciente',icon:'🌓'},{x:cycle/2,title:'Luna llena',icon:'🌕'},{x:cycle*3/4,title:'Cuarto menguante',icon:'🌗'}];
      for(const phase of phaseNames) {
        if ((prev<=a && prev<=phase.x && phase.x<a) || (prev>a && (phase.x>prev || phase.x<a))) events.push({date,phase});
      }
    }
    const moonWeek=dates.map(date=>{
      const mid=new Date(date.getTime()+12*3600000);
      const m=lunar(mid);
      const dusk=solarEvent(date,lat,lon,false);
      return `<tr><td>${safe(dayText(date))}</td><td>${safe(m.label)}</td><td>${m.light}%</td><td>${safe(clock(dusk,tz))}</td></tr>`;
    }).join('');
    const showersHTML=showerItems.length ? showerItems.map(({item,peak})=>`<div class="sky-card"><h4>🌠 ${safe(item.name)}</h4><p><strong>Máximo habitual:</strong> alrededor del ${safe(dayText(peak))}.</p><p>${safe(item.note)}</p><small>La fecha es orientativa. No garantiza meteoros visibles ni una observación organizada.</small></div>`).join('') : `<div class="sky-card"><h4>🌌 Una semana para observar</h4><p>No coincide con el máximo habitual de las principales lluvias de meteoros de nuestro calendario.</p><p>Busca una zona oscura y disfruta de constelaciones, estrellas y la Luna.</p></div>`;
    const phasesHTML=events.length ? events.map(({date,phase})=>`<div class="sky-card"><h4>${phase.icon} ${phase.title}</h4><p>Alrededor del <strong>${safe(dayText(date))}</strong>.</p><small>Momento de fase estimado mediante un ciclo lunar medio.</small></div>`).join('') : `<div class="sky-card"><h4>🌙 La Luna cambia cada noche</h4><p>No hay una fase principal calculada dentro de esta semana. Consulta cómo evoluciona en el calendario de abajo.</p></div>`;
    output.hidden=false;
    output.innerHTML=`<div class="sky-summary"><h3>El cielo desde ${safe(name)}</h3><p>Semana del <strong>${safe(longText(monday))}</strong> al <strong>${safe(longText(sunday))}</strong>.</p><div class="sky-chiprow"><span class="sky-chip">📍 Referencia: ${safe(capital)}</span><span class="sky-chip">🌙 ${safe(moonNow.label)} · ${moonNow.light}% iluminada aprox.</span><span class="sky-chip">🌅 Amanecer hoy: ${safe(clock(sunrise,tz))}</span><span class="sky-chip">🌇 Atardecer hoy: ${safe(clock(sunset,tz))}</span></div><small>Los horarios son orientativos, en hora local. Varían dentro de cada provincia; también influyen montaña, horizonte y atmósfera.</small></div><div class="sky-cards">${phasesHTML}${showersHTML}</div><h3 style="margin:22px 0 8px;color:#315b43;font-family:Georgia,serif">🌙 Tus siete noches</h3><div class="sky-nights"><table><thead><tr><th>Día</th><th>Fase aproximada</th><th>Luz lunar</th><th>Puesta de sol</th></tr></thead><tbody>${moonWeek}</tbody></table></div><p class="sky-footnote">Los datos del Sol y de la Luna son cálculos orientativos, no observaciones en directo. Las lluvias de meteoros se basan en picos habituales; su actividad exacta cambia cada año. Aquí no se consulta la nubosidad ni hay una agenda verificada de actividades públicas. Para observaciones importantes, confirma previsiones y horarios en fuentes oficiales como <a href="https://astronomia.ign.es/" target="_blank" rel="noopener noreferrer">Astronomía IGN</a> o el <a href="https://www.imo.net/calendar/" target="_blank" rel="noopener noreferrer">calendario IMO</a>.</p>`;
    output.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
  }
  $('astro-consultar').addEventListener('click',render);
  province.addEventListener('change',()=>{if(!output.hidden) render();});
})();
