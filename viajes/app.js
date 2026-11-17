'use strict';
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = value => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const searchURL = query => 'https://www.google.com/search?q=' + encodeURIComponent(query);
const SPAIN = [{"name":"Sevilla","region":"Andalucía","lat":37.389,"lon":-5.984,"stay":68,"icon":"🕍","description":"Giralda, Triana y paseos junto al río.","international":false},{"name":"Cádiz","region":"Andalucía","lat":36.529,"lon":-6.289,"stay":62,"icon":"⛱️","description":"Mar, casco antiguo y atardeceres.","international":false},{"name":"Jerez de la Frontera","region":"Andalucía","lat":36.686,"lon":-6.137,"stay":54,"icon":"🌞","description":"Bodegas, plazas y ambiente andaluz.","international":false},{"name":"Huelva","region":"Andalucía","lat":37.262,"lon":-6.944,"stay":54,"icon":"🌊","description":"Marismas, cultura y paseos.","international":false},{"name":"Córdoba","region":"Andalucía","lat":37.889,"lon":-4.779,"stay":58,"icon":"🌺","description":"Patios, callejuelas y mezquita.","international":false},{"name":"Granada","region":"Andalucía","lat":37.177,"lon":-3.598,"stay":63,"icon":"🏰","description":"Miradores y barrios con encanto.","international":false},{"name":"Málaga","region":"Andalucía","lat":36.721,"lon":-4.421,"stay":76,"icon":"🌴","description":"Museos, mar y vida urbana.","international":false},{"name":"Ronda","region":"Andalucía","lat":36.747,"lon":-5.165,"stay":65,"icon":"🌉","description":"Puente, sierra y senderos.","international":false},{"name":"Antequera","region":"Andalucía","lat":37.019,"lon":-4.56,"stay":51,"icon":"🌳","description":"Dólmenes y naturaleza.","international":false},{"name":"Úbeda","region":"Andalucía","lat":38.013,"lon":-3.37,"stay":52,"icon":"🏛️","description":"Patrimonio renacentista.","international":false},{"name":"Jaén","region":"Andalucía","lat":37.779,"lon":-3.786,"stay":52,"icon":"🫒","description":"Castillo y casco histórico.","international":false},{"name":"Almería","region":"Andalucía","lat":36.838,"lon":-2.46,"stay":59,"icon":"☀️","description":"Alcazaba y costa.","international":false},{"name":"Nerja","region":"Andalucía","lat":36.747,"lon":-3.879,"stay":70,"icon":"🏖️","description":"Calas y paseos junto al mar.","international":false},{"name":"Madrid","region":"Madrid","lat":40.417,"lon":-3.704,"stay":98,"icon":"🏛️","description":"Puerta del Sol, barrios y museos.","international":false},{"name":"Aranjuez","region":"Madrid","lat":40.036,"lon":-3.603,"stay":63,"icon":"🌳","description":"Jardines y ribera.","international":false},{"name":"Alcalá de Henares","region":"Madrid","lat":40.481,"lon":-3.364,"stay":67,"icon":"📚","description":"Universidad y calles históricas.","international":false},{"name":"San Lorenzo de El Escorial","region":"Madrid","lat":40.591,"lon":-4.148,"stay":77,"icon":"🌲","description":"Sierra y patrimonio.","international":false},{"name":"Barcelona","region":"Cataluña","lat":41.387,"lon":2.17,"stay":115,"icon":"🚴","description":"Modernismo, playas y paseos.","international":false},{"name":"Girona","region":"Cataluña","lat":41.979,"lon":2.822,"stay":82,"icon":"🌉","description":"Calles medievales junto al río.","international":false},{"name":"Tarragona","region":"Cataluña","lat":41.119,"lon":1.245,"stay":73,"icon":"🏛️","description":"Mar y pasado romano.","international":false},{"name":"Sitges","region":"Cataluña","lat":41.237,"lon":1.806,"stay":96,"icon":"⛱️","description":"Paseo marítimo y casco bonito.","international":false},{"name":"Vic","region":"Cataluña","lat":41.93,"lon":2.254,"stay":68,"icon":"🌳","description":"Plaza mayor y pueblos cercanos.","international":false},{"name":"Lleida","region":"Cataluña","lat":41.617,"lon":0.622,"stay":64,"icon":"⛪","description":"Castillo y paseo junto al Segre.","international":false},{"name":"Figueres","region":"Cataluña","lat":42.267,"lon":2.961,"stay":70,"icon":"🎨","description":"Arte y centro histórico.","international":false},{"name":"Valencia","region":"Comunidad Valenciana","lat":39.469,"lon":-0.376,"stay":84,"icon":"🚴","description":"Turia, playa y gastronomía.","international":false},{"name":"Alicante","region":"Comunidad Valenciana","lat":38.345,"lon":-0.49,"stay":75,"icon":"⛱️","description":"Castillo y playa urbana.","international":false},{"name":"Castellón de la Plana","region":"Comunidad Valenciana","lat":39.986,"lon":-0.051,"stay":64,"icon":"🌳","description":"Costa y rutas tranquilas.","international":false},{"name":"Elche","region":"Comunidad Valenciana","lat":38.269,"lon":-0.698,"stay":62,"icon":"🌴","description":"Palmeral y barrios históricos.","international":false},{"name":"Xàtiva","region":"Comunidad Valenciana","lat":38.99,"lon":-0.518,"stay":60,"icon":"🏰","description":"Castillo y montaña.","international":false},{"name":"Altea","region":"Comunidad Valenciana","lat":38.599,"lon":-0.052,"stay":89,"icon":"🌺","description":"Calles blancas y mar.","international":false},{"name":"Peñíscola","region":"Comunidad Valenciana","lat":40.358,"lon":0.406,"stay":79,"icon":"🏖️","description":"Castillo junto al Mediterráneo.","international":false},{"name":"Murcia","region":"Murcia","lat":37.984,"lon":-1.129,"stay":60,"icon":"🌴","description":"Plazas y ambiente gastronómico.","international":false},{"name":"Cartagena","region":"Murcia","lat":37.605,"lon":-0.986,"stay":66,"icon":"🏛️","description":"Teatro romano y puerto.","international":false},{"name":"Lorca","region":"Murcia","lat":37.672,"lon":-1.699,"stay":53,"icon":"🏰","description":"Castillo y patrimonio.","international":false},{"name":"Águilas","region":"Murcia","lat":37.405,"lon":-1.584,"stay":60,"icon":"⛱️","description":"Playas y paseo marítimo.","international":false},{"name":"Toledo","region":"Castilla-La Mancha","lat":39.862,"lon":-4.028,"stay":78,"icon":"🧭","description":"Miradores y ciudad medieval.","international":false},{"name":"Cuenca","region":"Castilla-La Mancha","lat":40.071,"lon":-2.137,"stay":65,"icon":"🏘️","description":"Casas Colgadas y naturaleza.","international":false},{"name":"Guadalajara","region":"Castilla-La Mancha","lat":40.632,"lon":-3.167,"stay":62,"icon":"🌳","description":"Patrimonio y rutas cerca.","international":false},{"name":"Albacete","region":"Castilla-La Mancha","lat":38.995,"lon":-1.858,"stay":55,"icon":"🚲","description":"Parques y ciudad cómoda.","international":false},{"name":"Ciudad Real","region":"Castilla-La Mancha","lat":38.986,"lon":-3.927,"stay":53,"icon":"🌻","description":"Rutas manchegas y plazas.","international":false},{"name":"Sigüenza","region":"Castilla-La Mancha","lat":41.068,"lon":-2.643,"stay":75,"icon":"🏰","description":"Callejuelas y castillo.","international":false},{"name":"Segovia","region":"Castilla y León","lat":40.949,"lon":-4.119,"stay":72,"icon":"🏛️","description":"Acueducto y casco histórico.","international":false},{"name":"Ávila","region":"Castilla y León","lat":40.657,"lon":-4.7,"stay":63,"icon":"🧱","description":"Murallas y vistas.","international":false},{"name":"Salamanca","region":"Castilla y León","lat":40.97,"lon":-5.664,"stay":68,"icon":"📚","description":"Plaza Mayor y vida universitaria.","international":false},{"name":"Valladolid","region":"Castilla y León","lat":41.652,"lon":-4.728,"stay":68,"icon":"🌳","description":"Paseos y patrimonio.","international":false},{"name":"Burgos","region":"Castilla y León","lat":42.344,"lon":-3.697,"stay":70,"icon":"⛪","description":"Catedral y río.","international":false},{"name":"León","region":"Castilla y León","lat":42.598,"lon":-5.571,"stay":68,"icon":"🥾","description":"Catedral y Camino de Santiago.","international":false},{"name":"Zamora","region":"Castilla y León","lat":41.504,"lon":-5.746,"stay":58,"icon":"🌉","description":"Río Duero y patrimonio.","international":false},{"name":"Soria","region":"Castilla y León","lat":41.764,"lon":-2.468,"stay":61,"icon":"🌲","description":"Naturaleza y paseos.","international":false},{"name":"Santiago de Compostela","region":"Galicia","lat":42.88,"lon":-8.545,"stay":72,"icon":"🥾","description":"Catedral y Camino de Santiago.","international":false},{"name":"A Coruña","region":"Galicia","lat":43.362,"lon":-8.411,"stay":77,"icon":"🌊","description":"Torre de Hércules y costa.","international":false},{"name":"Pontevedra","region":"Galicia","lat":42.431,"lon":-8.644,"stay":65,"icon":"🌺","description":"Plazas peatonales.","international":false},{"name":"Vigo","region":"Galicia","lat":42.241,"lon":-8.72,"stay":74,"icon":"⛵","description":"Ría y paseos.","international":false},{"name":"Lugo","region":"Galicia","lat":43.011,"lon":-7.556,"stay":59,"icon":"🧱","description":"Muralla romana.","international":false},{"name":"Ourense","region":"Galicia","lat":42.336,"lon":-7.864,"stay":56,"icon":"♨️","description":"Termas y río.","international":false},{"name":"Oviedo","region":"Asturias","lat":43.361,"lon":-5.849,"stay":74,"icon":"🌳","description":"Centro histórico.","international":false},{"name":"Gijón","region":"Asturias","lat":43.532,"lon":-5.661,"stay":78,"icon":"🌊","description":"Mar y sidrerías.","international":false},{"name":"Avilés","region":"Asturias","lat":43.557,"lon":-5.925,"stay":64,"icon":"🎨","description":"Casco histórico.","international":false},{"name":"Llanes","region":"Asturias","lat":43.421,"lon":-4.757,"stay":85,"icon":"⛱️","description":"Playas y paisaje verde.","international":false},{"name":"Santander","region":"Cantabria","lat":43.463,"lon":-3.81,"stay":91,"icon":"⛵","description":"Bahía y playas.","international":false},{"name":"Comillas","region":"Cantabria","lat":43.386,"lon":-4.291,"stay":83,"icon":"🏛️","description":"Modernismo y mar.","international":false},{"name":"Castro Urdiales","region":"Cantabria","lat":43.383,"lon":-3.22,"stay":77,"icon":"🌊","description":"Puerto y casco histórico.","international":false},{"name":"Santillana del Mar","region":"Cantabria","lat":43.389,"lon":-4.108,"stay":88,"icon":"🏘️","description":"Calles de piedra.","international":false},{"name":"Bilbao","region":"País Vasco","lat":43.263,"lon":-2.935,"stay":105,"icon":"🎨","description":"Museos y ría.","international":false},{"name":"San Sebastián","region":"País Vasco","lat":43.318,"lon":-1.981,"stay":128,"icon":"🌊","description":"La Concha y pintxos.","international":false},{"name":"Vitoria-Gasteiz","region":"País Vasco","lat":42.846,"lon":-2.672,"stay":80,"icon":"🌳","description":"Anillo verde.","international":false},{"name":"Hondarribia","region":"País Vasco","lat":43.361,"lon":-1.79,"stay":93,"icon":"⛵","description":"Puerto y calles con encanto.","international":false},{"name":"Pamplona","region":"Navarra","lat":42.812,"lon":-1.645,"stay":74,"icon":"🚴","description":"Parques y casco antiguo.","international":false},{"name":"Tudela","region":"Navarra","lat":42.061,"lon":-1.605,"stay":63,"icon":"🌿","description":"Huertas y gastronomía.","international":false},{"name":"Olite","region":"Navarra","lat":42.481,"lon":-1.651,"stay":67,"icon":"🏰","description":"Palacio y casco medieval.","international":false},{"name":"Estella","region":"Navarra","lat":42.672,"lon":-2.032,"stay":60,"icon":"🥾","description":"Camino y plazas.","international":false},{"name":"Logroño","region":"La Rioja","lat":42.463,"lon":-2.445,"stay":72,"icon":"🍇","description":"Tapeo y paseos.","international":false},{"name":"Haro","region":"La Rioja","lat":42.576,"lon":-2.848,"stay":66,"icon":"🍇","description":"Bodegas y rutas.","international":false},{"name":"Calahorra","region":"La Rioja","lat":42.302,"lon":-1.966,"stay":57,"icon":"🌳","description":"Patrimonio y ribera.","international":false},{"name":"Nájera","region":"La Rioja","lat":42.417,"lon":-2.728,"stay":60,"icon":"🥾","description":"Camino y entorno natural.","international":false},{"name":"Zaragoza","region":"Aragón","lat":41.649,"lon":-0.887,"stay":74,"icon":"⛲","description":"El Pilar y río Ebro.","international":false},{"name":"Huesca","region":"Aragón","lat":42.14,"lon":-0.409,"stay":66,"icon":"⛰️","description":"Entrada al Pirineo.","international":false},{"name":"Teruel","region":"Aragón","lat":40.344,"lon":-1.107,"stay":59,"icon":"🏰","description":"Arte mudéjar.","international":false},{"name":"Jaca","region":"Aragón","lat":42.571,"lon":-0.549,"stay":76,"icon":"🥾","description":"Montaña y ciudadela.","international":false},{"name":"Cáceres","region":"Extremadura","lat":39.475,"lon":-6.372,"stay":64,"icon":"🏰","description":"Casco medieval.","international":false},{"name":"Mérida","region":"Extremadura","lat":38.917,"lon":-6.344,"stay":64,"icon":"🏛️","description":"Teatro romano.","international":false},{"name":"Badajoz","region":"Extremadura","lat":38.879,"lon":-6.97,"stay":56,"icon":"🌉","description":"Alcazaba y Guadiana.","international":false},{"name":"Trujillo","region":"Extremadura","lat":39.459,"lon":-5.882,"stay":61,"icon":"🧭","description":"Plaza e historia.","international":false},{"name":"Plasencia","region":"Extremadura","lat":40.031,"lon":-6.09,"stay":61,"icon":"🌳","description":"Monfragüe y patrimonio.","international":false},{"name":"Palma","region":"Baleares","lat":39.57,"lon":2.65,"stay":115,"icon":"⛱️","description":"Catedral y Mediterráneo.","international":false},{"name":"Sóller","region":"Baleares","lat":39.766,"lon":2.714,"stay":119,"icon":"🚂","description":"Tranvía y montañas.","international":false},{"name":"Alcúdia","region":"Baleares","lat":39.851,"lon":3.121,"stay":120,"icon":"🏖️","description":"Murallas y playas.","international":false},{"name":"Ciutadella","region":"Baleares","lat":40.001,"lon":3.839,"stay":127,"icon":"🌊","description":"Puerto y calles.","international":false},{"name":"Las Palmas de Gran Canaria","region":"Canarias","lat":28.124,"lon":-15.436,"stay":90,"icon":"⛱️","description":"Las Canteras y casco histórico.","international":false},{"name":"Santa Cruz de Tenerife","region":"Canarias","lat":28.463,"lon":-16.251,"stay":90,"icon":"🌴","description":"Ciudad y rutas junto al mar.","international":false},{"name":"La Laguna","region":"Canarias","lat":28.488,"lon":-16.315,"stay":84,"icon":"🏛️","description":"Patrimonio y plazas.","international":false},{"name":"Puerto de la Cruz","region":"Canarias","lat":28.416,"lon":-16.551,"stay":90,"icon":"🌺","description":"Paseos y océano.","international":false},{"name":"Arrecife","region":"Canarias","lat":28.96,"lon":-13.547,"stay":92,"icon":"🌋","description":"Volcanes y litoral.","international":false}];
const INTERNATIONAL = [{"name":"Lisboa","region":"Portugal","lat":38.722,"lon":-9.139,"stay":105,"icon":"🚋","description":"Tranvías, miradores y barrios.","international":true},{"name":"Oporto","region":"Portugal","lat":41.15,"lon":-8.61,"stay":87,"icon":"🌉","description":"Ribera y azulejos.","international":true},{"name":"Faro","region":"Portugal","lat":37.02,"lon":-7.93,"stay":72,"icon":"⛱️","description":"Algarve y costa.","international":true},{"name":"Évora","region":"Portugal","lat":38.571,"lon":-7.908,"stay":69,"icon":"🏛️","description":"Calles blancas y patrimonio.","international":true},{"name":"Braga","region":"Portugal","lat":41.55,"lon":-8.426,"stay":68,"icon":"🌳","description":"Patrimonio del norte portugués.","international":true},{"name":"Coímbra","region":"Portugal","lat":40.204,"lon":-8.429,"stay":68,"icon":"📚","description":"Ciudad universitaria.","international":true},{"name":"Tavira","region":"Portugal","lat":37.125,"lon":-7.65,"stay":72,"icon":"🏖️","description":"Ría Formosa y casco bonito.","international":true},{"name":"Toulouse","region":"Francia","lat":43.604,"lon":1.444,"stay":85,"icon":"🚴","description":"Ladrillo rosa y canal.","international":true},{"name":"Burdeos","region":"Francia","lat":44.837,"lon":-0.58,"stay":92,"icon":"🍇","description":"Paseos y río.","international":true},{"name":"Bayona","region":"Francia","lat":43.493,"lon":-1.475,"stay":82,"icon":"🌉","description":"Calles y costa vascofrancesa.","international":true},{"name":"Perpiñán","region":"Francia","lat":42.697,"lon":2.895,"stay":72,"icon":"☀️","description":"Centro histórico cerca de la frontera.","international":true},{"name":"Carcasona","region":"Francia","lat":43.213,"lon":2.351,"stay":89,"icon":"🏰","description":"Ciudadela medieval.","international":true},{"name":"Montpellier","region":"Francia","lat":43.611,"lon":3.877,"stay":88,"icon":"⛲","description":"Plazas y ambiente universitario.","international":true},{"name":"París","region":"Francia","lat":48.857,"lon":2.352,"stay":141,"icon":"🗼","description":"La Torre Eiffel y sus barrios.","international":true},{"name":"Lyon","region":"Francia","lat":45.764,"lon":4.836,"stay":102,"icon":"🌉","description":"Ríos, gastronomía y paseos.","international":true},{"name":"Pisa","region":"Italia","lat":43.723,"lon":10.397,"stay":91,"icon":"🏰","description":"La torre inclinada y Toscana.","international":true},{"name":"Roma","region":"Italia","lat":41.903,"lon":12.496,"stay":125,"icon":"🏛️","description":"Plazas, ruinas y helados.","international":true},{"name":"Milán","region":"Italia","lat":45.464,"lon":9.19,"stay":134,"icon":"🎨","description":"Duomo, diseño y paseos.","international":true},{"name":"Bolonia","region":"Italia","lat":44.495,"lon":11.343,"stay":94,"icon":"🍝","description":"Pórticos y gastronomía.","international":true},{"name":"Florencia","region":"Italia","lat":43.77,"lon":11.255,"stay":124,"icon":"🎨","description":"Arte, plazas y paseos.","international":true},{"name":"Nápoles","region":"Italia","lat":40.851,"lon":14.268,"stay":87,"icon":"🍕","description":"Pizza, calles y mar.","international":true},{"name":"Londres","region":"Reino Unido","lat":51.507,"lon":-0.128,"stay":164,"icon":"🕰️","description":"Big Ben y museos gratuitos.","international":true},{"name":"Bristol","region":"Reino Unido","lat":51.454,"lon":-2.588,"stay":110,"icon":"🌉","description":"Arte urbano y puerto.","international":true},{"name":"Edimburgo","region":"Reino Unido","lat":55.953,"lon":-3.189,"stay":138,"icon":"🏰","description":"Castillo y callejuelas.","international":true},{"name":"Marrakech","region":"Marruecos","lat":31.629,"lon":-7.981,"stay":65,"icon":"🌴","description":"Zocos y plazas.","international":true},{"name":"Tánger","region":"Marruecos","lat":35.759,"lon":-5.834,"stay":66,"icon":"🌊","description":"Costa y medina.","international":true},{"name":"Tetuán","region":"Marruecos","lat":35.578,"lon":-5.368,"stay":59,"icon":"🏘️","description":"Medina y arquitectura.","international":true},{"name":"Fez","region":"Marruecos","lat":34.062,"lon":-4.978,"stay":67,"icon":"🧭","description":"Medina histórica.","international":true},{"name":"Bruselas","region":"Bélgica","lat":50.847,"lon":4.352,"stay":113,"icon":"🍫","description":"Grand Place y barrios.","international":true},{"name":"Brujas","region":"Bélgica","lat":51.209,"lon":3.225,"stay":127,"icon":"🌉","description":"Canales y calles medievales.","international":true},{"name":"Ámsterdam","region":"Países Bajos","lat":52.368,"lon":4.904,"stay":162,"icon":"🚴","description":"Canales y bicicletas.","international":true},{"name":"Róterdam","region":"Países Bajos","lat":51.924,"lon":4.478,"stay":113,"icon":"🌉","description":"Arquitectura y puerto.","international":true},{"name":"Berlín","region":"Alemania","lat":52.52,"lon":13.405,"stay":114,"icon":"🎨","description":"Historia, cultura y parques.","international":true},{"name":"Praga","region":"Chequia","lat":50.075,"lon":14.438,"stay":85,"icon":"🏰","description":"Puentes y callejuelas.","international":true},{"name":"Budapest","region":"Hungría","lat":47.497,"lon":19.04,"stay":79,"icon":"🌉","description":"Puentes y termas.","international":true},{"name":"Nueva York","region":"Estados Unidos","lat":40.712,"lon":-74.006,"stay":235,"icon":"🗽","description":"Estatua de la Libertad y la gran ciudad.","international":true}];
const ORIGINS = [{"name":"Sanlúcar la Mayor","lat":37.389,"lon":-6.203,"region":"Andalucía"},{"name":"Dos Hermanas","lat":37.284,"lon":-5.924,"region":"Andalucía"},{"name":"Sanlúcar de Barrameda","lat":36.779,"lon":-6.353,"region":"Andalucía"},{"name":"Marbella","lat":36.51,"lon":-4.885,"region":"Andalucía"},{"name":"Algeciras","lat":36.14,"lon":-5.456,"region":"Andalucía"},{"name":"El Puerto de Santa María","lat":36.594,"lon":-6.233,"region":"Andalucía"},{"name":"Getafe","lat":40.308,"lon":-3.732,"region":"Madrid"},{"name":"Móstoles","lat":40.323,"lon":-3.864,"region":"Madrid"},{"name":"Leganés","lat":40.328,"lon":-3.764,"region":"Madrid"},{"name":"Hospitalet de Llobregat","lat":41.36,"lon":2.099,"region":"Cataluña"},{"name":"Badalona","lat":41.45,"lon":2.247,"region":"Cataluña"},{"name":"Torrevieja","lat":37.978,"lon":-0.683,"region":"Comunidad Valenciana"},{"name":"Benidorm","lat":38.541,"lon":-0.122,"region":"Comunidad Valenciana"},{"name":"Motril","lat":36.745,"lon":-3.522,"region":"Andalucía"},{"name":"Vélez-Málaga","lat":36.782,"lon":-4.099,"region":"Andalucía"},{"name":"San Fernando","lat":36.468,"lon":-6.195,"region":"Andalucía"},{"name":"Ferrol","lat":43.483,"lon":-8.236,"region":"Galicia"},{"name":"Donostia","lat":43.318,"lon":-1.981,"region":"País Vasco"},{"name":"Ceuta","lat":35.89,"lon":-5.318,"region":"Ceuta"},{"name":"Melilla","lat":35.292,"lon":-2.938,"region":"Melilla"}];

const ALL_ORIGINS = [...SPAIN,...ORIGINS];
const seasons = {flexible:'con fechas flexibles',fechas:'en tus fechas',primavera:'en primavera',verano:'en verano',otono:'en otoño',invierno:'en invierno',puente:'en un puente o festivo'};
const RAD = Math.PI / 180;
const formatMoney = num => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(num);
function kmBetween(a,b) {
  const dLat=(b.lat-a.lat)*RAD, dLon=(b.lon-a.lon)*RAD;
  const h=Math.sin(dLat/2)**2+Math.cos(a.lat*RAD)*Math.cos(b.lat*RAD)*Math.sin(dLon/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
function findOrigin(query) {
  const key=norm(query);
  const exact=ALL_ORIGINS.find(p=>norm(p.name)===key);
  if (exact) return exact;
  // No adivinamos geografía para ciudades que no constan en nuestro catálogo.
  return null;
}
function seasonFactor(place, when, depart) {
  const month=when==='fechas' ? Number(depart.slice(5,7)) : 0;
  const summer=when==='verano'||[7,8].includes(month);
  const winter=when==='invierno'||[1,2].includes(month);
  const peak=when==='puente' || [12].includes(month);
  let factor=summer?1.28:winter?1.03:peak?1.34:when==='primavera'?1.09:when==='otono'?1.04:1;
  if (summer && (place.icon==='⛱️'||place.icon==='🏖️'||place.icon==='🌊')) factor*=1.18;
  return factor;
}
function roughEstimate(origin, place, people, nights, when, depart, mode, isInternational) {
  const km=kmBetween(origin,place);
  const travelRoad=km*1.23;
  const domesticFlight=isInternational?120:95;
  // Sólo es una heurística para ordenar propuestas, no una tarifa comercial.
  const publicTransport=Math.max(10,travelRoad*.115)*2*people;
  const carCost=travelRoad*.22*2 + (isInternational ? 18 : 0);
  const flightCost=(domesticFlight+km*.13)*people;
  const ground=Math.min(publicTransport,carCost);
  let travel = mode==='coche'?carCost : mode==='tren'?publicTransport : mode==='avion'?flightCost : Math.min(ground,flightCost);
  if (isInternational && mode==='coche' && km>1600) travel+=110;
  const originIsland=['Canarias','Baleares'].includes(origin.region);
  const destinationIsland=['Canarias','Baleares'].includes(place.region);
  if(originIsland!==destinationIsland || (originIsland && destinationIsland && origin.region!==place.region)) {
    // Aproximación al coste de vuelo/barco entre islas y península.
    travel=Math.max(travel,people*125);
  }
  if(origin.region==='Canarias' && place.region==='Canarias' && km>60) travel=Math.max(travel,people*85);
  if(origin.region==='Baleares' && place.region==='Baleares' && km>60) travel=Math.max(travel,people*60);
  const factor=seasonFactor(place,when,depart);
  const nightsCost=place.stay * Math.max(0,nights) * Math.max(1,Math.ceil(people/2)) * factor;
  const days=Math.max(1,nights+1);
  const food=people*days*(isInternational?24:21);
  const total=(travel+nightsCost+food)*factor;
  return {km,estimate:Math.round(total/10)*10,travel:Math.round(travel/10)*10};
}
function makeOptions(origin, budget, people, nights, when, depart, mode, type, excludedNames=new Set()) {
  const regions = type==='regional'
    ? SPAIN.filter(p=>p.region===origin.region)
    : type==='nacional' ? SPAIN.filter(p=>p.region!==origin.region) : INTERNATIONAL;
  let candidates=regions.filter(p=>norm(p.name)!==norm(origin.name)&&!excludedNames.has(norm(p.name)));
  // Cuando no hay cuatro destinos de la comunidad, ampliamos a provincias cercanas,
  // y lo indicamos explícitamente en las tarjetas como "cercano".
  if(type==='regional' && candidates.length<4){
    const existing=new Set(candidates.map(p=>norm(p.name)));
    candidates.push(...SPAIN.filter(p=>p.region!==origin.region&&!existing.has(norm(p.name))&&!excludedNames.has(norm(p.name))&&norm(p.name)!==norm(origin.name)).sort((a,b)=>kmBetween(origin,a)-kmBetween(origin,b)).slice(0,4-candidates.length));
  }
  const scored=candidates.map(place=>{
    const estimate=roughEstimate(origin,place,people,nights,when,depart,mode,type==='internacional');
    const ratio=estimate.estimate/Math.max(budget,1);
    const excess=Math.max(0,ratio-1);
    // La distancia manda al principio, pero un destino demasiado caro cae posiciones.
    // Un presupuesto mayor permite destinos más lejanos sin que siempre gane el mismo.
    const budgetScale=Math.min(1,budget/900);
    const distanceWeight=(type==='regional' ? .57 : type==='nacional' ? .34 : .27) * (1-.52*budgetScale);
    const costWeight=type==='regional' ? .46 : type==='nacional' ? .51 : .62;
    const targetShare=type==='regional' ? .42 : type==='nacional' ? .60 : .72;
    const targetBudget=budget*targetShare;
    const budgetUtilizationPenalty=Math.abs(estimate.estimate-targetBudget)*(.18+.53*budgetScale);
    const score=estimate.km*distanceWeight + estimate.estimate*costWeight + budgetUtilizationPenalty + excess*excess*360;
    return {...place,...estimate,score,affordable:ratio<=1};
  }).sort((a,b)=>a.score-b.score || a.km-b.km);
  // Primero propuestas dentro del presupuesto, cuando las hay; luego las más cercanas al límite.
  // No ocultamos las que exceden el presupuesto: marcamos claramente la incertidumbre.
  return scored.slice(0,4);
}
function transportQuery(mode,origin,place,dates,people){
  const style=mode==='tren'?'tren autobús':mode==='coche'?'viaje coche peajes':mode==='avion'?'vuelos baratos':'tren autobús vuelos ofertas';
  return `${style} ${origin} ${place} ida y vuelta ${dates} ${people} personas precio`;
}
function renderCard(o, budget, people, nights, dates, mode, item, kind) {
  const compatible=item.estimate<=budget;
  const status=compatible?'Orientativamente encaja':'Puede superar tu presupuesto';
  const note=compatible ? 'Cifra orientativa, no oferta ni precio reservado.' : 'No tenemos una oferta que confirme este precio.';
  const transport=searchURL(transportQuery(mode,o.name,item.name,dates,people));
  const lodging=searchURL(`alojamientos ${item.name} ${dates} ${people} personas ${nights} noches precio total`);
  const activities=searchURL(`qué ver gratis en ${item.name} ${dates}`);
  return `<article class="trip ${kind} ${compatible?'plausible':'overbudget'}"><div class="trip-top"><span class="trip-icon" aria-hidden="true">${escapeHTML(item.icon)}</span><span class="tag">${Math.round(item.km)} km en línea recta</span></div>
    <h4>${escapeHTML(item.name)}</h4><div class="where">${escapeHTML(item.region)}</div><p>${escapeHTML(item.description)}</p>
    <div class="trip-estimate"><span>${escapeHTML(status)}</span><strong>≈ ${formatMoney(item.estimate)}</strong></div>
    <small class="estimate-note">${escapeHTML(note)}</small>
    <div class="actions"><a target="_blank" rel="noopener noreferrer" href="${escapeHTML(transport)}">🚆 Transporte ↗</a><a target="_blank" rel="noopener noreferrer" href="${escapeHTML(lodging)}">🏡 Alojamiento ↗</a><a target="_blank" rel="noopener noreferrer" href="${escapeHTML(activities)}">🎟️ Planes ↗</a></div>
  </article>`;
}
function renderGroup(title,description,items,kind,origin,budget,people,nights,dates,mode){
  return `<section class="group ${kind}-group"><div class="group-head"><h3>${title}</h3><p>${description}</p></div><div class="suggestions">${items.map(p=>renderCard(origin,budget,people,nights,dates,mode,p,kind)).join('')}</div></section>`;
}

const form = $('descubrir');
$('year').textContent = new Date().getFullYear();
const today = new Date();
const localDate = new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
$('salida').min = localDate; $('regreso').min = localDate;
$('cuando').addEventListener('change', () => {
  const specific=$('cuando').value==='fechas';
  $('fechas-contenedor').classList.toggle('hidden',!specific);
  $('salida').required=specific; $('regreso').required=specific;
});
$('salida').addEventListener('change', () => { $('regreso').min = $('salida').value || localDate; });
const list=$('origenes-sugeridos');
list.innerHTML=ALL_ORIGINS.slice().sort((a,b)=>a.name.localeCompare(b.name,'es')).map(p=>`<option value="${escapeHTML(p.name)}"></option>`).join('');

form.addEventListener('submit', event => {
  event.preventDefault();
  const originName=$('origen').value.trim();
  const origin=findOrigin(originName);
  const budget=Number($('presupuesto').value);
  const people=Number($('personas').value);
  const nights=Number($('duracion').value);
  const when=$('cuando').value;
  const depart=$('salida').value, back=$('regreso').value;
  const mode=$('transporte').value;
  const target=$('resultados');
  target.hidden=false;
  if(!origin){
    target.innerHTML='<h2>Vamos a situar tu ciudad 🧭</h2><p class="lead">Para priorizar los destinos por cercanía, selecciona una ciudad de las sugerencias al escribir. Así no te damos distancias inventadas.</p>';
    return;
  }
  if(!Number.isFinite(budget)||budget<20||!Number.isInteger(people)||people<1)return;
  if(when==='fechas' && (!depart||!back||depart<localDate||back<depart)){
    target.innerHTML='<h2>Revisa las fechas</h2><p class="lead">La salida debe ser futura y el regreso igual o posterior.</p>';
    return;
  }
  if(when==='fechas'){
    const actualNights=Math.round((new Date(back+'T12:00:00')-new Date(depart+'T12:00:00'))/86400000);
    if(actualNights!==nights){
      target.innerHTML=`<h2>Las noches no cuadran</h2><p class="lead">Has elegido ${nights} ${nights===1?'noche':'noches'}, pero las fechas suman ${actualNights}. Ajusta la duración o las fechas para comparar propuestas.</p>`;
      return;
    }
  }
  const dates=when==='fechas' ? `del ${depart} al ${back}` : seasons[when];
  const regional=makeOptions(origin,budget,people,nights,when,depart,mode,'regional');
  const national=makeOptions(origin,budget,people,nights,when,depart,mode,'nacional',new Set(regional.map(p=>norm(p.name))));
  const international=makeOptions(origin,budget,people,nights,when,depart,mode,'internacional');
  const under=[...regional,...national,...international].filter(x=>x.affordable).length;
  const budgetWarning=under===0?'Con este presupuesto, ninguna de las 12 ideas entra en nuestra estimación. Prueba menos noches, más flexibilidad o una excursión de un día.':`De las 12 ideas, ${under} entran en la estimación orientativa; verifica los precios reales antes de decidir.`;
  const broad=searchURL(`escapadas desde ${origin.name} ${dates} ${people} viajeros presupuesto total ${budget} euros transporte hotel`);
  target.innerHTML=`<div class="result-hero"><div><h2>12 ideas desde ${escapeHTML(origin.name)} 🌍</h2><p class="lead">Tu presupuesto: <strong>${formatMoney(budget)} en total</strong> · ${people} ${people===1?'persona':'personas'} · ${nights===0?'excursión de un día':`${nights} ${nights===1?'noche':'noches'}`} · ${escapeHTML(dates)}.</p><p class="lead" style="margin-top:8px"><strong>${escapeHTML(budgetWarning)}</strong></p></div><div class="result-badges"><span>4 regionales</span><span>4 nacionales</span><span>4 internacionales</span></div></div>
  ${renderGroup('🌿 4 regionales','Tu comunidad o destinos vecinos cuando faltan opciones en el catálogo.',regional,'regional',origin,budget,people,nights,dates,mode)}
  ${renderGroup('🗺️ 4 nacionales','Fuera de tu comunidad, combinando distancia y presupuesto.',national,'national',origin,budget,people,nights,dates,mode)}
  ${renderGroup('✈️ 4 internacionales','Candidatas orientativas: si quedan fuera del dinero disponible, lo señalamos.',international,'international',origin,budget,people,nights,dates,mode)}
  <p class="tip"><strong>Ojo con las cifras:</strong> Son <strong>simulaciones aproximadas</strong> de transporte, alojamiento y comida, no precios consultados ni promesas de disponibilidad. La distancia es en línea recta: el recorrido real puede ser bastante mayor, especialmente entre islas o si hay transbordos. Las fechas, las conexiones y las ofertas reales pueden cambiarlo todo.</p>
  <p class="more-links"><a href="${escapeHTML(broad)}" target="_blank" rel="noopener noreferrer">🔎 Buscar ofertas reales con mi presupuesto ↗</a></p>`;
  target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
});
