/* ¡Apañate! Viajes: búsqueda alternativa por máxima distancia.
   Complemento de app.js, sin modificar su buscador original. */
(() => {
  'use strict';
  const form = document.getElementById('descubrir');
  if (!form || !document.getElementById('resultados')) return;
  const $f = id => document.getElementById(id);
  const original = form.querySelector('button.primary[type="submit"]');
  if (!original) return;
  let activeMode = 'normal';
  const buttons = document.createElement('div');
  buttons.className = 'travel-search-actions';
  buttons.setAttribute('role', 'group');
  buttons.setAttribute('aria-label', 'Tipo de búsqueda');
  original.parentNode.insertBefore(buttons, original);
  buttons.appendChild(original);
  const farButton = document.createElement('button');
  farButton.type = 'submit';
  farButton.className = 'primary far-button';
  farButton.textContent = '🌍 ¡Llévame lo más lejos posible! ↗';
  farButton.setAttribute('aria-label', 'Buscar cuatro destinos regionales, cuatro nacionales y cuatro internacionales lo más lejos posible con mi presupuesto');
  buttons.appendChild(farButton);
  const css = document.createElement('style');
  css.textContent = `.travel-search-actions{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.travel-search-actions>.primary{grid-column:auto;width:100%;min-height:58px}.far-button{background:linear-gradient(180deg,#286d72,#19545a);box-shadow:0 8px 0 rgba(25,84,90,.2)}.far-button:hover{background:linear-gradient(180deg,#36828a,#1a6268)}.far-rtw{border-color:#329381!important;background:#eaf9f0!important}.far-rtw .trip-estimate{background:#d9f3e4!important;color:#1b5844!important}@media(max-width:760px){.travel-search-actions{grid-template-columns:1fr}}`;
  document.head.appendChild(css);
  original.addEventListener('click', () => { activeMode='normal'; });
  farButton.addEventListener('click', () => { activeMode='far'; });

  const n = value => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const html = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = num => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(num);
  const query = text => 'https://www.google.com/search?q='+encodeURIComponent(text);
  const cat = { flexible:'con fechas flexibles',fechas:'en tus fechas',primavera:'en primavera',verano:'en verano',otono:'en otoño',invierno:'en invierno',puente:'en un puente o festivo' };
  // Distancias basadas en el catálogo que ya usa la web. No es una búsqueda de tarifas de transporte.
  function farOptions(origin, budget, people, nights, when, depart, mode, type, exclude) {
    let pool = type==='regional' ? SPAIN.filter(x=>x.region===origin.region) :
      type==='nacional' ? SPAIN.filter(x=>x.region!==origin.region) : INTERNATIONAL.slice();
    pool = pool.filter(x=>n(x.name)!==n(origin.name) && !exclude.has(n(x.name)));
    if(type==='regional' && pool.length<4){
      const present=new Set(pool.map(x=>n(x.name)));
      pool.push(...SPAIN.filter(x=>x.region!==origin.region&&!present.has(n(x.name))&&!exclude.has(n(x.name))&&n(x.name)!==n(origin.name))
        .sort((a,b)=>kmBetween(origin,a)-kmBetween(origin,b)).slice(0,4-pool.length));
    }
    const available = pool.map(place=>{
      const values=roughEstimate(origin,place,people,nights,when,depart,mode,type==='internacional');
      return {...place,...values, affordable:values.estimate<=budget};
    });
    const byDistance=(a,b)=>b.km-a.km || a.estimate-b.estimate;
    const affordable=available.filter(x=>x.affordable).sort(byDistance).slice(0,4);
    const chosen=new Set(affordable.map(x=>n(x.name)));
    // Un destino que excede el presupuesto NUNCA se muestra como compatible.
    const extras=available.filter(x=>!chosen.has(n(x.name))).sort((a,b)=>{
      const excessA=Math.max(0,a.estimate-budget), excessB=Math.max(0,b.estimate-budget);
      return excessA-excessB || byDistance(a,b);
    }).slice(0,Math.max(0,4-affordable.length));
    return [...affordable,...extras];
  }
  // Umbral de planificación prudente; NO es una tarifa de aerolínea.
  // Star Alliance admite 10 días, pero proponemos 30 noches para un viaje con cierta holgura.
  const RTW_MIN_NIGHTS=30;
  const RTW_BUDGET_PER_PERSON=8000;
  const rtwEstimate=(people,nights)=>people*(RTW_BUDGET_PER_PERSON+Math.max(0,nights-RTW_MIN_NIGHTS)*60);
  function canRTW(budget,people,nights,mode){
    return nights>=RTW_MIN_NIGHTS && budget>=rtwEstimate(people,nights) && (mode==='avion'||mode==='cualquiera');
  }
  function renderRTW(origin,budget,people,nights,dates){
    const total=rtwEstimate(people,nights);
    const airlines='https://www.roundtheworld.staralliance.com/staralliance/ES/round-the-world';
    const ow='https://es.oneworld.com/round-the-world';
    return `<article class="trip international plausible far-rtw"><div class="trip-top"><span class="trip-icon" aria-hidden="true">🌍</span><span class="tag">Varios continentes · Ruta circular</span></div><h4>Vuelta al Mundo</h4><div class="where">Europa · Asia · Oceanía · América · regreso</div><p>Una ruta alrededor del planeta, con cruces del Atlántico y del Pacífico. La duración y el presupuesto permiten considerarla, pero no hay vuelos ni hoteles verificados.</p><div class="trip-estimate"><span>Umbral orientativo de planificación</span><strong>Desde ≈ ${money(total)}</strong></div><small class="estimate-note">${people} ${people===1?'persona':'personas'} · ${nights} noches · ${html(dates)}. Referencia no cotizada. Visados, documentación, seguros y disponibilidad dependen de la ruta.</small><div class="actions"><a href="${airlines}" target="_blank" rel="noopener noreferrer">✈️ Star Alliance ↗</a><a href="${ow}" target="_blank" rel="noopener noreferrer">🌐 oneworld ↗</a><a href="${html(query('vuelta al mundo presupuesto '+people+' personas '+nights+' noches desde '+origin.name))}" target="_blank" rel="noopener noreferrer">🔎 Comparar costes ↗</a></div></article>`;
  }
  const formatCard=(origin,budget,people,nights,dates,mode,item,kind)=>{
    const valid=item.estimate<=budget;
    return `<article class="trip ${kind} ${valid?'plausible':'overbudget'}"><div class="trip-top"><span class="trip-icon" aria-hidden="true">${html(item.icon||'🧭')}</span><span class="tag">${Math.round(item.km)} km en línea recta</span></div><h4>${html(item.name)}</h4><div class="where">${html(item.region)}</div><p>${html(item.description)}</p><div class="trip-estimate"><span>${valid?'Orientativamente encaja':'Puede superar tu presupuesto'}</span><strong>≈ ${money(item.estimate)}</strong></div><small class="estimate-note">${valid?'Estimación, no oferta ni precio reservado.':'Se muestra como alternativa, pero excede la estimación disponible.'}</small><div class="actions"><a target="_blank" rel="noopener noreferrer" href="${html(query('transporte '+origin.name+' '+item.name+' ida vuelta '+dates+' '+people+' viajeros'))}">🚆 Transporte ↗</a><a target="_blank" rel="noopener noreferrer" href="${html(query('alojamiento '+item.name+' '+dates+' '+people+' personas '+nights+' noches'))}">🏡 Alojamiento ↗</a><a target="_blank" rel="noopener noreferrer" href="${html(query('qué ver gratis en '+item.name+' '+dates))}">🎟️ Planes ↗</a></div></article>`;
  };
  function group(title,info,items,kind,origin,budget,people,nights,dates,mode,rtw){
    return `<section class="group ${kind}-group"><div class="group-head"><h3>${title}</h3><p>${info}</p></div><div class="suggestions">${items.map(x=>x.rtw?renderRTW(origin,budget,people,nights,dates):formatCard(origin,budget,people,nights,dates,mode,x,kind)).join('')}</div></section>`;
  }
  function showFar() {
    const target=$f('resultados');
    // Respetamos las validaciones del buscador original: solo continuamos si generó resultados.
    if(!target.querySelector('.result-hero')) return;
    const origin=findOrigin($f('origen').value.trim());
    if(!origin) return;
    const budget=Number($f('presupuesto').value), people=Number($f('personas').value), nights=Number($f('duracion').value);
    const when=$f('cuando').value, depart=$f('salida').value, mode=$f('transporte').value;
    const dates=when==='fechas'?`del ${depart} al ${$f('regreso').value}`:(cat[when]||'con fechas flexibles');
    const regional=farOptions(origin,budget,people,nights,when,depart,mode,'regional',new Set());
    const national=farOptions(origin,budget,people,nights,when,depart,mode,'nacional',new Set(regional.map(x=>n(x.name))));
    const international=farOptions(origin,budget,people,nights,when,depart,mode,'internacional',new Set());
    if(canRTW(budget,people,nights,mode) && international.length===4) international[3]={rtw:true};
    const under=[...regional,...national,...international].filter(x=>x.rtw||x.affordable).length;
    const notice=under===12?'Las doce propuestas entran en la estimación orientativa.':`${under} de las 12 propuestas entran en la estimación orientativa; las restantes se señalan como alternativas por encima de tu presupuesto.`;
    target.innerHTML=`<div class="result-hero"><div><h2>Lejos, tan lejos como permita el dinero 🌍</h2><p class="lead">Desde <strong>${html(origin.name)}</strong> · ${money(budget)} en total · ${people} ${people===1?'persona':'personas'} · ${nights} noches · ${html(dates)}.</p><p class="lead" style="margin-top:8px"><strong>${html(notice)}</strong></p></div><div class="result-badges"><span>4 regionales</span><span>4 nacionales</span><span>4 internacionales</span></div></div>
    ${group('🌿 4 regionales','Lo más lejos dentro de tu comunidad, si la estimación lo permite.',regional,'regional',origin,budget,people,nights,dates,mode)}
    ${group('🗺️ 4 nacionales','Priorizamos los destinos más distantes que encajan en tu presupuesto.',national,'national',origin,budget,people,nights,dates,mode)}
    ${group('✈️ 4 internacionales','Las distancias son geográficas; tarifas, rutas y disponibilidad deben confirmarse.',international,'international',origin,budget,people,nights,dates,mode)}
    <p class="tip"><strong>Importante:</strong> distancias en línea recta y costes simulados; no hay precios de vuelos ni alojamientos en tiempo real. «Vuelta al Mundo» solo aparece con al menos 30 noches, un umbral desde 8.000 € por persona (mayor para estancias más largas) y transporte aéreo en la selección. No garantiza que sea reservable por ese precio.</p>`;
  }
  form.addEventListener('submit', () => {
    const chosen=activeMode;
    activeMode='normal';
    if(chosen==='far') showFar();
  });
  // Hacemos posible la Vuelta al Mundo sin alterar las duraciones originales.
  const duration=$f('duracion');
  for(const [value,label] of [[10,'10 noches'],[14,'14 noches'],[21,'21 noches'],[30,'30 noches'],[45,'45 noches'],[60,'60 noches'],[90,'90 noches']]){
    if(!duration.querySelector(`option[value="${value}"]`)){
      const option=document.createElement('option'); option.value=value; option.textContent=label; duration.appendChild(option);
    }
  }
})();
