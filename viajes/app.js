'use strict';
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = value => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const searchURL = query => 'https://www.google.com/search?q='+encodeURIComponent(query);
const destinations = {
  andalucia: [
    ['Cádiz','Paseos por el casco antiguo, playas y gastronomía.', 'Cercanía y planes al aire libre'],
    ['Córdoba','Patios, callejuelas y rutas culturales.', 'Escapada cultural'],
    ['Granada','Miradores, Albaicín y paseos con encanto.', 'Ciudad con mucho que descubrir'],
    ['Ronda','Paisajes, senderos y casco histórico.', 'Naturaleza y pueblo con encanto'],
    ['Málaga','Mar, museos y rutas urbanas.', 'Ciudad y costa'],
    ['Huelva','Costa, naturaleza y pueblos cercanos.', 'Desconexión tranquila']
  ],
  centro: [
    ['Segovia','Acueducto, historia y paseos por el centro.', 'Escapada cultural'],
    ['Toledo','Rutas a pie, miradores y casco histórico.', 'Historia y callejuelas'],
    ['Ávila','Murallas y paseos por el centro histórico.', 'Historia y paseo'],
    ['Cuenca','Casas Colgadas, miradores y naturaleza.', 'Ciudad y naturaleza'],
    ['Aranjuez','Jardines y excursiones de un día.', 'Plan de proximidad'],
    ['Salamanca','Plazas, patrimonio y ambiente universitario.', 'Ciudad con encanto']
  ],
  noreste: [
    ['Girona','Barrios históricos, río y paseos.', 'Escapada urbana'],
    ['Tarragona','Ruinas romanas, mar y casco antiguo.', 'Historia junto al mar'],
    ['Zaragoza','Paseos junto al Ebro y monumentos.', 'Ciudad cultural'],
    ['Lleida','Castillo, río y rutas naturales.', 'Alternativa tranquila'],
    ['Sitges','Paseos junto al Mediterráneo.', 'Costa y desconexión'],
    ['Vic','Casco histórico y excursiones cercanas.', 'Plan diferente']
  ],
  levante: [
    ['Alicante','Paseos, castillo y playas urbanas.', 'Mar y ciudad'],
    ['Castellón de la Plana','Costa y rutas naturales en la provincia.', 'Paisajes y tranquilidad'],
    ['Xàtiva','Castillo, patrimonio y ambiente de pueblo.', 'Historia cercana'],
    ['Murcia','Plazas, patrimonio y gastronomía.', 'Escapada urbana'],
    ['Elche','Palmeral y rutas por la ciudad.', 'Naturaleza y cultura'],
    ['Altea','Calles blancas y paseos junto al mar.', 'Pueblo costero']
  ],
  noroeste: [
    ['Santiago de Compostela','Centro histórico y callejuelas.', 'Historia y ambiente'],
    ['A Coruña','Costa, paseos y zonas verdes.', 'Ciudad y mar'],
    ['Pontevedra','Casco antiguo peatonal y plazas.', 'Paseo tranquilo'],
    ['Lugo','Muralla romana y naturaleza.', 'Historia y paseo'],
    ['León','Catedral, barrios y gastronomía.', 'Escapada cultural'],
    ['Ourense','Río, centro histórico y paseos.', 'Descanso y ciudad']
  ],
  norte: [
    ['Santander','Bahía, playas y paseos.', 'Mar y ciudad'],
    ['Bilbao','Ría, arquitectura y rutas urbanas.', 'Cultura y paseo'],
    ['Vitoria-Gasteiz','Anillo verde y casco medieval.', 'Ciudad verde'],
    ['Gijón','Paseos costeros y ambiente marinero.', 'Costa y gastronomía'],
    ['Oviedo','Casco antiguo y rutas culturales.', 'Ciudad con encanto'],
    ['Burgos','Catedral y paseo junto al río.', 'Historia y patrimonio']
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
$('salida').addEventListener('change', () => {$('regreso').min = $('salida').value || localDate;});
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
    target.innerHTML = '<h2>Revisa las fechas</h2><p>Elige una salida futura y un regreso igual o posterior.</p>';
    return;
  }
  const region = (zoneByOrigin.find(([,rx]) => rx.test(norm(origin))) || [null])[0];
  const availablePerPerson = budget / people;
  const duration = nights === 0 ? 'una excursión de un día' : `${nights} ${nights === 1 ? 'noche' : 'noches'}`;
  const datesLabel = when === 'fechas' ? `del ${depart} al ${back}` : seasons[when];
  const dateQuery = when === 'fechas' ? `${depart} ${back}` : (when === 'flexible' ? 'fechas flexibles' : when === 'puente' ? 'próximo puente' : when);
  const transport = mode === 'cualquiera' ? 'tren autobús coche avión' : mode === 'tren' ? 'tren autobús' : mode === 'coche' ? 'ruta en coche' : 'vuelos';
  let pool = region ? destinations[region].filter(d => norm(d[0]) !== norm(origin)) : destinations.centro;
  // Con presupuestos ajustados priorizamos opciones de proximidad de la zona identificada.
  // Para vuelos abrimos también la búsqueda «cualquier destino» sin inventar una tarifa.
  if (mode === 'avion') pool = [
    ['Destinos flexibles desde '+origin,'Compara aeropuertos y fechas: el destino puede ser una sorpresa.','Cualquier destino'],
    ...pool.slice(0,3)
  ];
  const tighter = availablePerPerson < 90 || (availablePerPerson < 160 && nights > 2);
  const options = pool.slice(0, tighter ? 4 : 6);
  const fmt = new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0});
  const cards = options.map(([place,description,label]) => {
    const isFlexible = place.startsWith('Destinos flexibles desde ');
    const travelQuery = isFlexible
      ? `vuelos baratos desde ${origin} a cualquier destino ${dateQuery}`
      : `${transport} desde ${origin} a ${place} ${dateQuery} billetes`; 
    const lodgingQuery = `alojamiento ${place} ${dateQuery} ${people} personas ${nights} noches barato`;
    return `<article class="trip"><div class="tag">${escapeHTML(label)}</div><h3>${escapeHTML(place)}</h3><p>${escapeHTML(description)}</p><div class="actions"><a href="${escapeHTML(searchURL(travelQuery))}" target="_blank" rel="noopener noreferrer">Consultar transporte ↗</a>${isFlexible ? '' : `<a href="${escapeHTML(searchURL(lodgingQuery))}" target="_blank" rel="noopener noreferrer">Ver alojamientos ↗</a>`}</div></article>`;
  }).join('');
  const wider = searchURL(`escapadas baratas desde ${origin} ${dateQuery} ${people} personas presupuesto total ${budget} euros sin destino fijo`);
  target.hidden = false;
  target.innerHTML = `<h2>Ideas para salir desde ${escapeHTML(origin)}</h2><p class="lead">Tu límite es <strong>${fmt.format(budget)} en total</strong> para ${people} ${people===1?'persona':'personas'}, ${escapeHTML(duration)}, ${escapeHTML(datesLabel)}. No hemos elegido un destino por ti: estas son <strong>pistas para investigar</strong>.</p><div class="suggestions">${cards}</div><p class="tip"><strong>Consejo para apañarte:</strong> ${tighter ? 'Con ese presupuesto conviene empezar por una excursión cercana, transporte público o una sola noche. ' : 'Compara varias fechas, días entre semana y alojamientos sencillos. '}Cuenta también comidas, transporte local y posibles tasas. Ninguna propuesta tiene precio confirmado.</p><p><a href="${escapeHTML(wider)}" target="_blank" rel="noopener noreferrer"><strong>🔎 Explorar más ofertas sin destino fijo ↗</strong></a></p>`;
  target.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
});
