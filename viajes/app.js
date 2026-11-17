'use strict';
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = value => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const searchURL = query => 'https://www.google.com/search?q=' + encodeURIComponent(query);
const transportText = mode => mode === 'cualquiera' ? 'tren autobús coche avión' : mode === 'tren' ? 'tren autobús' : mode === 'coche' ? 'ruta en coche' : 'vuelos';

const regionalDestinations = {
  andalucia: [
    {place:'Cádiz', icon:'⛱️', label:'Regional', description:'Casco antiguo, playa y tapeo para una escapada muy agradecida.'},
    {place:'Córdoba', icon:'🌿', label:'Regional', description:'Patios, callejuelas y plan cultural fácil de encajar.'},
    {place:'Granada', icon:'🏰', label:'Regional', description:'Miradores, Albaicín y ambiente para callejear sin parar.'},
    {place:'Ronda', icon:'🚴', label:'Regional', description:'Puente, sierra y aire libre si te apetece desconectar.'}
  ],
  centro: [
    {place:'Segovia', icon:'🏛️', label:'Regional', description:'Acueducto, cochinillo y paseo por una ciudad compacta.'},
    {place:'Toledo', icon:'🧭', label:'Regional', description:'Murallas, miradores y un día muy completo a pie.'},
    {place:'Ávila', icon:'🌳', label:'Regional', description:'Muralla, patrimonio y plan tranquilo.'},
    {place:'Aranjuez', icon:'🚲', label:'Regional', description:'Jardines, ribera y excursión cómoda de cercanía.'}
  ],
  noreste: [
    {place:'Girona', icon:'🌉', label:'Regional', description:'Calles con encanto, río y ambiente de escapada urbana.'},
    {place:'Tarragona', icon:'🏖️', label:'Regional', description:'Ruinas romanas y mar para combinar cultura y sol.'},
    {place:'Zaragoza', icon:'⛲', label:'Regional', description:'Riberas del Ebro y mucho patrimonio fácil de recorrer.'},
    {place:'Sitges', icon:'☀️', label:'Regional', description:'Paseo marítimo y escapada ligera junto al Mediterráneo.'}
  ],
  levante: [
    {place:'Alicante', icon:'⛱️', label:'Regional', description:'Castillo, paseo marítimo y muchas horas de sol.'},
    {place:'Xàtiva', icon:'🏰', label:'Regional', description:'Historia, castillo y ambiente de pueblo con encanto.'},
    {place:'Altea', icon:'🌺', label:'Regional', description:'Casas blancas y ritmo lento para desconectar.'},
    {place:'Murcia', icon:'🌴', label:'Regional', description:'Plazas, gastronomía y escapada urbana muy amable.'}
  ],
  noroeste: [
    {place:'Santiago de Compostela', icon:'🥾', label:'Regional', description:'Piedra, soportales y aroma a Camino de Santiago.'},
    {place:'A Coruña', icon:'🌊', label:'Regional', description:'Mar, paseo marítimo y escapada muy paseable.'},
    {place:'Pontevedra', icon:'🌿', label:'Regional', description:'Casco antiguo peatonal, plazas y ritmo tranquilo.'},
    {place:'Lugo', icon:'🧱', label:'Regional', description:'Muralla, tapeo y plan cultural distinto.'}
  ],
  norte: [
    {place:'Santander', icon:'⛵', label:'Regional', description:'Bahía, playa y ciudad cómoda para una pausa bonita.'},
    {place:'Bilbao', icon:'🎨', label:'Regional', description:'Ría, pinchos y cultura urbana con carácter.'},
    {place:'Vitoria-Gasteiz', icon:'🌳', label:'Regional', description:'Ciudad verde y plan relajado entre parques y casco antiguo.'},
    {place:'Gijón', icon:'🌊', label:'Regional', description:'Paseo costero, sidra y ambiente marinero.'}
  ],
  default: [
    {place:'Segovia', icon:'🏛️', label:'Regional', description:'Escapada cercana y muy fácil de disfrutar.'},
    {place:'Cádiz', icon:'⛱️', label:'Regional', description:'Sol, mar y casco histórico para cambiar de aire.'},
    {place:'Girona', icon:'🌉', label:'Regional', description:'Calles bonitas y ritmo de fin de semana.'},
    {place:'Santiago de Compostela', icon:'🥾', label:'Regional', description:'Paseo, piedra y buen ambiente.'}
  ]
};

const nationalByOrigin = {
  andalucia: [
    {place:'Madrid', icon:'🏛️', label:'Nacional', description:'Puerta del Sol, museos y escapada con mucha vida.'},
    {place:'Valencia', icon:'🚴', label:'Nacional', description:'Jardín del Turia, playa y plan urbano muy completo.'},
    {place:'San Sebastián', icon:'🌊', label:'Nacional', description:'Concha, pintxos y paseo elegante.'},
    {place:'Santiago de Compostela', icon:'🥾', label:'Nacional', description:'Casco histórico y guiño al Camino.'}
  ],
  centro: [
    {place:'Sevilla', icon:'🕍', label:'Nacional', description:'Giralda, barrios con duende y tapeo largo.'},
    {place:'Valencia', icon:'🚴', label:'Nacional', description:'Mar, bici y paseo por el Turia.'},
    {place:'Bilbao', icon:'🎨', label:'Nacional', description:'Cultura, pintxos y escapada con personalidad.'},
    {place:'Santiago de Compostela', icon:'🥾', label:'Nacional', description:'Piedra, soportales y ambiente jacobeo.'}
  ],
  noreste: [
    {place:'Madrid', icon:'🏛️', label:'Nacional', description:'Puerta del Sol, barrios castizos y mucha actividad.'},
    {place:'Sevilla', icon:'🕍', label:'Nacional', description:'Giralda, plazas y noches templadas.'},
    {place:'Valencia', icon:'⛱️', label:'Nacional', description:'Costa y ciudad para una escapada luminosa.'},
    {place:'Santiago de Compostela', icon:'🥾', label:'Nacional', description:'Historia y Camino de Santiago.'}
  ],
  levante: [
    {place:'Madrid', icon:'🏛️', label:'Nacional', description:'Puerta del Sol, museos y escapada urbana intensa.'},
    {place:'Sevilla', icon:'🕍', label:'Nacional', description:'Giralda, patios y mucha vida en la calle.'},
    {place:'Granada', icon:'🏰', label:'Nacional', description:'Miradores, historia y ambiente joven.'},
    {place:'Santiago de Compostela', icon:'🥾', label:'Nacional', description:'Paseos, piedra y Camino.'}
  ],
  noroeste: [
    {place:'Madrid', icon:'🏛️', label:'Nacional', description:'Buena conexión y mucho plan para un finde.'},
    {place:'Sevilla', icon:'🕍', label:'Nacional', description:'Giralda, Triana y cambio de paisaje total.'},
    {place:'Valencia', icon:'🚴', label:'Nacional', description:'Playa, bici y ambiente mediterráneo.'},
    {place:'Málaga', icon:'☀️', label:'Nacional', description:'Costa, museos y buen clima.'}
  ],
  norte: [
    {place:'Madrid', icon:'🏛️', label:'Nacional', description:'Capital muy apañada para una escapada sin complicarte.'},
    {place:'Sevilla', icon:'🕍', label:'Nacional', description:'Giralda, tapeo y escapada con sabor.'},
    {place:'Valencia', icon:'🚴', label:'Nacional', description:'Turia, arroz y paseo mediterráneo.'},
    {place:'Santiago de Compostela', icon:'🥾', label:'Nacional', description:'Historia, plazas y Camino.'}
  ],
  default: [
    {place:'Madrid', icon:'🏛️', label:'Nacional', description:'Puerta del Sol, museos y mucho movimiento.'},
    {place:'Sevilla', icon:'🕍', label:'Nacional', description:'Giralda, barrios con ambiente y mucho encanto.'},
    {place:'Valencia', icon:'🚴', label:'Nacional', description:'Mar, ciudad y un plan muy agradecido.'},
    {place:'Santiago de Compostela', icon:'🥾', label:'Nacional', description:'Historia, callejuelas y Camino.'}
  ]
};

const internationalByOrigin = {
  andalucia: [
    {place:'Lisboa', icon:'🌉', label:'Internacional', description:'Tranvías, cuestas y buen plan urbano si pillas oferta.'},
    {place:'Marrakech', icon:'🌴', label:'Internacional', description:'Cambio de aires total para una escapada distinta.'},
    {place:'París', icon:'🗼', label:'Internacional', description:'La Torre Eiffel siempre es buena excusa si encaja el vuelo.'},
    {place:'Londres', icon:'🕰️', label:'Internacional', description:'Big Ben, museos y paseo urbano a lo grande.'}
  ],
  centro: [
    {place:'Lisboa', icon:'🌉', label:'Internacional', description:'Muy buen clásico para escaparse sin ir muy lejos.'},
    {place:'París', icon:'🗼', label:'Internacional', description:'Escapada europea con mucho icono y mucho paseo.'},
    {place:'Londres', icon:'🕰️', label:'Internacional', description:'Big Ben, parques y museos para perderte unos días.'},
    {place:'Pisa', icon:'🏰', label:'Internacional', description:'Foto con la torre inclinada y salto rápido a la Toscana.'}
  ],
  noreste: [
    {place:'Toulouse', icon:'🚲', label:'Internacional', description:'Muy cómoda para un salto corto al sur de Francia.'},
    {place:'París', icon:'🗼', label:'Internacional', description:'Una escapada clásica con la Eiffel como reclamo.'},
    {place:'Londres', icon:'🕰️', label:'Internacional', description:'Big Ben, barrios con vida y plan muy urbano.'},
    {place:'Pisa', icon:'🏰', label:'Internacional', description:'La torre inclinada como excusa para una escapada italiana.'}
  ],
  levante: [
    {place:'Palma', icon:'⛱️', label:'Internacional-like', description:'Si te apetece isla sin salir del entorno cercano.'},
    {place:'París', icon:'🗼', label:'Internacional', description:'Buen salto europeo si encuentras precio apañado.'},
    {place:'Londres', icon:'🕰️', label:'Internacional', description:'Museos, parques y muchas cosas gratis que hacer.'},
    {place:'Pisa', icon:'🏰', label:'Internacional', description:'Italia compacta y muy fotogénica.'}
  ],
  noroeste: [
    {place:'Oporto', icon:'🍷', label:'Internacional', description:'Muy natural desde el noroeste: río, azulejo y buen paseo.'},
    {place:'Lisboa', icon:'🌉', label:'Internacional', description:'Capital cercana para una escapada fácil de cuadrar.'},
    {place:'París', icon:'🗼', label:'Internacional', description:'El clásico europeo si quieres tirar un poco más lejos.'},
    {place:'Londres', icon:'🕰️', label:'Internacional', description:'Big Ben y muchos planes urbanos.'}
  ],
  norte: [
    {place:'Burdeos', icon:'🍇', label:'Internacional', description:'Salto francés cómodo desde el norte.'},
    {place:'París', icon:'🗼', label:'Internacional', description:'Ciudad-icono para un finde largo.'},
    {place:'Londres', icon:'🕰️', label:'Internacional', description:'Escapada clásica si cazas un vuelo apañado.'},
    {place:'Pisa', icon:'🏰', label:'Internacional', description:'Foto con la torre y paseo italiano.'}
  ],
  default: [
    {place:'Lisboa', icon:'🌉', label:'Internacional', description:'Cerca, luminosa y agradecida para empezar.'},
    {place:'París', icon:'🗼', label:'Internacional', description:'La Torre Eiffel siempre suma en una escapada.'},
    {place:'Londres', icon:'🕰️', label:'Internacional', description:'Big Ben, museos y mucha vida.'},
    {place:'Nueva York', icon:'🗽', label:'Internacional', description:'Más ambiciosa: Estatua de la Libertad si el presupuesto acompaña.'}
  ]
};

const zoneByOrigin = [
  ['andalucia', /sevilla|cadiz|cádiz|huelva|cordoba|córdoba|granada|malaga|málaga|jaen|jaén|almeria|almería|jerez|dos hermanas|sanlucar|sanlúcar|marbella|algeciras/],
  ['centro', /madrid|toledo|cuenca|guadalajara|avila|ávila|segovia|salamanca|valladolid|ciudad real|albacete/],
  ['noreste', /barcelona|girona|gerona|lleida|lerida|lérida|tarragona|zaragoza|huesca|teruel/],
  ['levante', /valencia|valència|alicante|alacant|castellon|castellón|murcia|cartagena|elche|elx|benidorm/],
  ['noroeste', /coruña|coruna|santiago|pontevedra|vigo|ourense|orense|lugo|leon|león|zamora/],
  ['norte', /bilbao|donostia|san sebastian|san sebastián|vitoria|gasteiz|santander|gijon|gijón|oviedo|burgos|pamplona|iruna|iruña|logroño/]
];
const seasons = {flexible:'con fechas flexibles',fechas:'en tus fechas',primavera:'en primavera',verano:'en verano',otono:'en otoño',invierno:'en invierno',puente:'en algún puente o festivo'};

function renderCard(origin, people, nights, whenText, dateQuery, mode, item, extraClass='') {
  const transport = transportText(mode);
  const tripQuery = `${transport} desde ${origin} a ${item.place} ${dateQuery} ${people} personas`;
  const lodgingQuery = `alojamiento barato ${item.place} ${dateQuery} ${people} personas ${nights} noches`;
  const ideasQuery = `qué ver en ${item.place} ${whenText}`;
  return `<article class="trip ${extraClass}"><div class="trip-top"><span class="trip-icon" aria-hidden="true">${escapeHTML(item.icon)}</span><span class="tag">${escapeHTML(item.label)}</span></div><h3>${escapeHTML(item.place)}</h3><p>${escapeHTML(item.description)}</p><div class="actions"><a href="${escapeHTML(searchURL(tripQuery))}" target="_blank" rel="noopener noreferrer">Transporte ↗</a><a href="${escapeHTML(searchURL(lodgingQuery))}" target="_blank" rel="noopener noreferrer">Alojamiento ↗</a><a href="${escapeHTML(searchURL(ideasQuery))}" target="_blank" rel="noopener noreferrer">Qué hacer ↗</a></div></article>`;
}

function getZone(origin) {
  return (zoneByOrigin.find(([,rx]) => rx.test(norm(origin))) || ['default'])[0];
}

function budgetTip(budget, people, nights) {
  const perPerson = budget / people;
  if (perPerson < 90 || (perPerson < 160 && nights > 2)) {
    return 'Con ese presupuesto, empieza por las 4 ideas regionales: te dará más juego ir cerca, dormir poco o incluso hacer escapada de un día.';
  }
  if (perPerson < 220) {
    return 'Con ese margen, las ideas nacionales suelen ser el equilibrio más apañado. Juega con fechas entre semana y reserva pronto.';
  }
  return 'Con este presupuesto puedes mirar también internacionales, pero compara bien el transporte y vigila equipaje, tasas y transporte local.';
}

const form = $('descubrir');
$('year').textContent = new Date().getFullYear();
const today = new Date();
const localDate = new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
$('salida').min = localDate; $('regreso').min = localDate;
$('cuando').addEventListener('change', () => {
  const specific = $('cuando').value === 'fechas';
  $('fechas-contenedor').classList.toggle('hidden', !specific);
  $('salida').required = specific; $('regreso').required = specific;
});
$('salida').addEventListener('change', () => { $('regreso').min = $('salida').value || localDate; });

form.addEventListener('submit', event => {
  event.preventDefault();
  const origin = $('origen').value.trim();
  const budget = Number($('presupuesto').value);
  const people = Number($('personas').value);
  const nights = Number($('duracion').value);
  const when = $('cuando').value;
  const mode = $('transporte').value;
  const depart = $('salida').value;
  const back = $('regreso').value;
  const target = $('resultados');

  if (!origin || !Number.isFinite(budget) || budget < 20 || !Number.isInteger(people) || people < 1) return;
  if (when === 'fechas' && (!depart || !back || depart < localDate || back < depart)) {
    target.hidden = false;
    target.innerHTML = '<h2>Revisa las fechas</h2><p class="lead">Elige una salida futura y un regreso igual o posterior.</p>';
    return;
  }

  const zone = getZone(origin);
  const regional = (regionalDestinations[zone] || regionalDestinations.default).slice(0,4);
  const national = (nationalByOrigin[zone] || nationalByOrigin.default).slice(0,4);
  const international = (internationalByOrigin[zone] || internationalByOrigin.default).slice(0,4);

  const duration = nights === 0 ? 'una excursión de un día' : `${nights} ${nights === 1 ? 'noche' : 'noches'}`;
  const datesLabel = when === 'fechas' ? `del ${depart} al ${back}` : seasons[when];
  const dateQuery = when === 'fechas' ? `${depart} ${back}` : (when === 'flexible' ? 'fechas flexibles' : when === 'puente' ? 'próximo puente' : when);
  const broaderSearch = searchURL(`escapadas baratas desde ${origin} ${dateQuery} ${people} personas presupuesto ${budget} euros sin destino fijo`);
  const priceSearch = searchURL(`ofertas viaje desde ${origin} ${dateQuery} presupuesto ${budget} euros ${people} personas`);
  const fmt = new Intl.NumberFormat('es-ES', {style:'currency', currency:'EUR', maximumFractionDigits:0});

  const regionalHTML = regional.map(item => renderCard(origin, people, nights, datesLabel, dateQuery, mode, item, 'regional')).join('');
  const nationalHTML = national.map(item => renderCard(origin, people, nights, datesLabel, dateQuery, mode, item, 'national')).join('');
  const internationalHTML = international.map(item => renderCard(origin, people, nights, datesLabel, dateQuery, mode, item, 'international')).join('');

  target.hidden = false;
  target.innerHTML = `
    <div class="result-hero">
      <div>
        <h2>12 ideas saliendo desde ${escapeHTML(origin)}</h2>
        <p class="lead">Presupuesto total: <strong>${fmt.format(budget)}</strong> para ${people} ${people === 1 ? 'persona' : 'personas'}, ${escapeHTML(duration)}, ${escapeHTML(datesLabel)}.</p>
      </div>
      <div class="result-badges"><span>4 regionales</span><span>4 nacionales</span><span>4 internacionales</span></div>
    </div>
    <section class="group regional-group">
      <div class="group-head"><h3>🌿 Cerca de ti</h3><p>Empezamos por la cercanía: las opciones con más pinta de cuadrar mejor.</p></div>
      <div class="suggestions">${regionalHTML}</div>
    </section>
    <section class="group national-group">
      <div class="group-head"><h3>🗺️ Para moverte por España</h3><p>Cambio de aires sin salir del país: ciudad, mar, cultura y algún guiño viajero.</p></div>
      <div class="suggestions">${nationalHTML}</div>
    </section>
    <section class="group international-group">
      <div class="group-head"><h3>✈️ Si te lanzas un poco más lejos</h3><p>Escapadas internacionales para mirar ofertas y ver si te encajan.</p></div>
      <div class="suggestions">${internationalHTML}</div>
    </section>
    <p class="tip"><strong>Consejo para apañarte:</strong> ${escapeHTML(budgetTip(budget, people, nights))}</p>
    <p class="more-links"><a href="${escapeHTML(priceSearch)}" target="_blank" rel="noopener noreferrer">💸 Buscar ofertas por presupuesto ↗</a><a href="${escapeHTML(broaderSearch)}" target="_blank" rel="noopener noreferrer">🔎 Explorar más destinos sin destino fijo ↗</a></p>
  `;

  target.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
});
