'use strict';
const $ = id => document.getElementById(id);
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Grupo climático orientativo predominante. No sustituye una consulta por municipio y altitud.
// 50 provincias y las dos ciudades autónomas. Canarias y Baleares afinan por isla.
const provinces = [
 ['Álava','oceano'],['Albacete','continental'],['Alicante','mediterraneo'],['Almería','seco'],
 ['Asturias','oceano'],['Ávila','frio'],['Badajoz','continental'],['Barcelona','mediterraneo'],
 ['Bizkaia','oceano'],['Burgos','frio'],['Cáceres','continental'],['Cádiz','mediterraneo'],
 ['Cantabria','oceano'],['Castellón','mediterraneo'],['Ceuta','mediterraneo'],['Ciudad Real','continental'],
 ['Córdoba','continental'],['A Coruña','oceano'],['Cuenca','frio'],['Gipuzkoa','oceano'],
 ['Girona','mediterraneo'],['Granada','continental'],['Guadalajara','continental'],['Huelva','mediterraneo'],
 ['Huesca','frio'],['Illes Balears','islasmed'],['Jaén','continental'],['La Rioja','continental'],
 ['Las Palmas','canarias'],['León','frio'],['Lleida','continental'],['Lugo','oceano'],
 ['Madrid','continental'],['Málaga','mediterraneo'],['Melilla','seco'],['Murcia','seco'],
 ['Navarra','continental'],['Ourense','continental'],['Palencia','frio'],['Pontevedra','oceano'],
 ['Salamanca','continental'],['Santa Cruz de Tenerife','canarias'],['Segovia','frio'],['Sevilla','continental'],
 ['Soria','frio'],['Tarragona','mediterraneo'],['Teruel','frio'],['Toledo','continental'],
 ['Valencia','mediterraneo'],['Valladolid','continental'],['Zamora','continental'],['Zaragoza','continental']
];
const islands = {
 'Illes Balears': [['Mallorca','islasmed'],['Menorca','islasmed'],['Ibiza','islasmed'],['Formentera','islasmed']],
 'Las Palmas':[['Gran Canaria','canarias'],['Lanzarote','seco'],['Fuerteventura','seco'],['La Graciosa','seco']],
 'Santa Cruz de Tenerife':[['Tenerife','canarias'],['La Palma','canarias'],['La Gomera','canarias'],['El Hierro','canarias']]
};
const climate = {
 oceano:{name:'Oceánico húmedo',icon:'🌧️',desc:'Lluvias frecuentes, humedad y temperaturas relativamente suaves. Cuidado con encharcamientos y viento costero.',tags:['Humedad habitual','Verano moderado']},
 mediterraneo:{name:'Mediterráneo litoral',icon:'☀️',desc:'Veranos secos y calurosos, inviernos generalmente suaves cerca del mar. Heladas posibles lejos de la costa.',tags:['Verano seco','Sol intenso']},
 seco:{name:'Seco y semiárido',icon:'🌵',desc:'Escasez de lluvia, mucho sol y alta evaporación. Prioriza especies austeras y sustratos que drenen.',tags:['Poca lluvia','Mucho sol']},
 continental:{name:'Interior con contrastes térmicos',icon:'🌤️',desc:'Veranos calurosos o secos e inviernos que pueden tener heladas. Conviene valorar la exposición de cada patio.',tags:['Heladas posibles','Verano intenso']},
 frio:{name:'Interior frío o de montaña',icon:'❄️',desc:'Inviernos fríos y riesgo de heladas. En exterior elige especies rústicas y protege macetas sensibles.',tags:['Frío invernal','Posibles heladas fuertes']},
 islasmed:{name:'Mediterráneo insular',icon:'🌊',desc:'Influencia marítima y sequía estival. El viento, la salinidad y la exposición importan tanto como la temperatura.',tags:['Brisa marina','Verano seco']},
 canarias:{name:'Subtropical canario (con microclimas)',icon:'🌴',desc:'Temperaturas suaves en muchas costas, pero grandes contrastes entre barlovento, zonas secas y cumbres. Ajusta por isla y altitud.',tags:['Microclimas','Alisios y altitud']}
};
// Fichas: luz: sol/indirecta/sombra; agua: bajo/medio/alto; dificultad 1-3;
// clima: claves donde suele funcionar en exterior. Mascotas = toxic/ok/unknown.
const plants = [
 {id:'poto',name:'Poto',latin:'Epipremnum aureum',emoji:'🌿',where:'interior',light:['indirecta','sombra'],water:'medio',level:1,pet:'toxic',care:'Deja secar la capa superior de tierra; evita el sol fuerte.',why:'Se adapta a muchas habitaciones con luz moderada.'},
 {id:'cinta',name:'Cinta',latin:'Chlorophytum comosum',emoji:'🌱',where:'interior',light:['indirecta','sombra'],water:'medio',level:1,pet:'ok',care:'Riega cuando empiece a secarse la tierra; evita encharcar.',why:'Es una buena compañera para interiores luminosos.'},
 {id:'aspidistra',name:'Aspidistra',latin:'Aspidistra elatior',emoji:'🍃',where:'interior',light:['indirecta','sombra'],water:'bajo',level:1,pet:'ok',care:'Tolera poca luz; deja secar parte del sustrato.',why:'Muy agradecida en habitaciones de sombra.'},
 {id:'sanse',name:'Sansevieria',latin:'Dracaena trifasciata',emoji:'🌵',where:'interior',light:['indirecta','sol','sombra'],water:'bajo',level:1,pet:'toxic',care:'Riega solo con tierra bien seca, especialmente en invierno.',why:'Tolera los olvidos mejor que el exceso de agua.'},
 {id:'zz',name:'Zamioculca',latin:'Zamioculcas zamiifolia',emoji:'🌿',where:'interior',light:['indirecta','sombra'],water:'bajo',level:1,pet:'toxic',care:'Deja secar completamente; el exceso de agua pudre raíces.',why:'Resiste períodos con poca atención.'},
 {id:'peperomia',name:'Peperomia',latin:'Peperomia obtusifolia',emoji:'🪴',where:'interior',light:['indirecta'],water:'medio',level:1,pet:'ok',care:'Luz indirecta y riegos moderados; drena bien.',why:'Compacta y cómoda para estanterías luminosas.'},
 {id:'kentia',name:'Kentia',latin:'Howea forsteriana',emoji:'🌴',where:'interior',light:['indirecta','sombra'],water:'medio',level:2,pet:'ok',care:'Evita sol directo fuerte y sequedad extrema.',why:'Palmera elegante para ambientes de luz filtrada.'},
 {id:'areca',name:'Areca',latin:'Dypsis lutescens',emoji:'🌴',where:'interior',light:['indirecta'],water:'alto',level:2,pet:'ok',care:'Agradece humedad ambiental y riegos regulares sin charcos.',why:'Da sensación de jungla en estancias luminosas.'},
 {id:'monstera',name:'Monstera',latin:'Monstera deliciosa',emoji:'🍀',where:'interior',light:['indirecta'],water:'medio',level:2,pet:'toxic',care:'Luz indirecta y deja secar la parte superior entre riegos.',why:'Hojas grandes para una esquina tropical.'},
 {id:'aloe',name:'Aloe vera',latin:'Aloe vera',emoji:'🌵',where:'both',light:['sol','indirecta'],water:'bajo',level:1,pet:'toxic',climates:['mediterraneo','seco','islasmed','canarias'],care:'Sustrato drenante; protege de heladas y exceso de lluvia.',why:'Para rincones soleados y secos.'},
 {id:'haworthia',name:'Haworthia',latin:'Haworthiopsis attenuata',emoji:'🌵',where:'interior',light:['indirecta'],water:'bajo',level:1,pet:'ok',care:'Deja secar el sustrato entre riegos.',why:'Suculenta pequeña para ventanas luminosas.'},
 {id:'helecho',name:'Helecho de Boston',latin:'Nephrolepis exaltata',emoji:'🌿',where:'interior',light:['indirecta','sombra'],water:'alto',level:2,pet:'ok',care:'Necesita humedad ambiental; evita resecar completamente la tierra.',why:'Le encantan rincones húmedos sin sol directo.'},
 {id:'ficus',name:'Ficus elástica',latin:'Ficus elastica',emoji:'🌳',where:'interior',light:['indirecta'],water:'medio',level:2,pet:'toxic',care:'Luz abundante filtrada y riego cuando seque arriba.',why:'Grandes hojas brillantes con presencia tropical.'},
 {id:'lavanda',name:'Lavanda',latin:'Lavandula angustifolia',emoji:'💜',where:'exterior',light:['sol'],water:'bajo',level:1,pet:'toxic',climates:['mediterraneo','seco','continental','frio','islasmed'],care:'Sol y suelo drenante; evita humedad estancada.',why:'Resiste sequía y aporta flor y aroma.'},
 {id:'romero',name:'Romero',latin:'Salvia rosmarinus',emoji:'🌾',where:'exterior',light:['sol'],water:'bajo',level:1,pet:'ok',climates:['mediterraneo','seco','continental','islasmed','canarias'],care:'Riego escaso tras establecerse y tierra drenante.',why:'Aromático, duro y propio de jardines secos.'},
 {id:'tomillo',name:'Tomillo',latin:'Thymus vulgaris',emoji:'🌱',where:'exterior',light:['sol'],water:'bajo',level:1,pet:'ok',climates:['mediterraneo','seco','continental','frio','islasmed'],care:'Sol, suelo pobre y poca agua; nada de charcos.',why:'Ideal para un rincón soleado y austero.'},
 {id:'geranio',name:'Geranio',latin:'Pelargonium zonale',emoji:'🌺',where:'exterior',light:['sol','indirecta'],water:'medio',level:1,pet:'toxic',climates:['mediterraneo','seco','continental','islasmed','canarias'],care:'Luz abundante, retira flores secas y protege de heladas.',why:'Color abundante para balcones y patios.'},
 {id:'clavel',name:'Clavel',latin:'Dianthus caryophyllus',emoji:'🌸',where:'exterior',light:['sol'],water:'medio',level:2,pet:'toxic',climates:['mediterraneo','seco','continental','islasmed'],care:'Sol, riego moderado y buen drenaje; evita heladas fuertes.',why:'Flores generosas con mucho carácter.'},
 {id:'buganvilla',name:'Buganvilla',latin:'Bougainvillea spp.',emoji:'🌺',where:'exterior',light:['sol'],water:'bajo',level:2,pet:'unknown',climates:['mediterraneo','seco','islasmed','canarias'],care:'Mucho sol y apoyo para trepar; sensible a heladas.',why:'Explosión de color en climas templados.'},
 {id:'hibisco',name:'Hibisco',latin:'Hibiscus rosa-sinensis',emoji:'🌺',where:'exterior',light:['sol','indirecta'],water:'medio',level:2,pet:'unknown',climates:['mediterraneo','islasmed','canarias'],care:'Sol suave, riego regular en verano y protección ante heladas.',why:'Flor tropical en patios cálidos y protegidos.'},
 {id:'agapanto',name:'Agapanto',latin:'Agapanthus africanus',emoji:'💠',where:'exterior',light:['sol','indirecta'],water:'medio',level:2,pet:'toxic',climates:['oceano','mediterraneo','islasmed','canarias'],care:'Buen drenaje y riego moderado en floración.',why:'Flores espectaculares en jardines templados.'},
 {id:'hortensia',name:'Hortensia',latin:'Hydrangea macrophylla',emoji:'🌸',where:'exterior',light:['indirecta','sombra'],water:'alto',level:2,pet:'toxic',climates:['oceano','frio'],care:'Tierra fresca, semisombra y riego atento en calor.',why:'Gran floración donde el ambiente es más húmedo.'},
 {id:'camelia',name:'Camelia',latin:'Camellia japonica',emoji:'🌺',where:'exterior',light:['indirecta','sombra'],water:'medio',level:2,pet:'ok',climates:['oceano'],care:'Suelo ácido y fresco, protegido del sol abrasador.',why:'Flores preciosas en climas atlánticos suaves.'},
 {id:'brezo',name:'Brezo',latin:'Calluna vulgaris',emoji:'🌸',where:'exterior',light:['sol','indirecta'],water:'medio',level:2,pet:'unknown',climates:['oceano','frio'],care:'Prefiere sustrato ácido y fresco; evita calor seco.',why:'Aporta color en zonas frescas y húmedas.'},
 {id:'sedum',name:'Sedum',latin:'Sedum spurium',emoji:'🌱',where:'exterior',light:['sol'],water:'bajo',level:1,pet:'unknown',climates:['continental','frio','mediterraneo','seco','oceano'],care:'Buen drenaje y poco riego; resistente al frío según variedad.',why:'Tapizante fuerte para exteriores soleados.'},
 {id:'siempreviva',name:'Siempreviva',latin:'Sempervivum tectorum',emoji:'🌵',where:'exterior',light:['sol'],water:'bajo',level:1,pet:'ok',climates:['continental','frio','mediterraneo','oceano'],care:'Muy poco riego y drenaje excelente; resiste frío.',why:'Perfecta para macetas y rocallas expuestas.'},
 {id:'rosal',name:'Rosal resistente',latin:'Rosa spp.',emoji:'🌹',where:'exterior',light:['sol'],water:'medio',level:2,pet:'ok',climates:['oceano','mediterraneo','continental','frio','islasmed'],care:'Sol, poda adecuada y riego al pie; puede tener espinas.',why:'Color clásico en casi cualquier jardín con sol.'},
 {id:'adelfa',name:'Adelfa',latin:'Nerium oleander',emoji:'🌸',where:'exterior',light:['sol'],water:'bajo',level:1,pet:'toxic',climates:['mediterraneo','seco','islasmed','canarias'],care:'Resiste calor y sequía cuando arraiga; todas sus partes son muy tóxicas.',why:'Floración muy vistosa para lugares cálidos.'},
 {id:'pita',name:'Agave',latin:'Agave americana',emoji:'🌵',where:'exterior',light:['sol'],water:'bajo',level:1,pet:'toxic',climates:['mediterraneo','seco','islasmed','canarias'],care:'Muchísimo espacio, poca agua; hojas con puntas peligrosas.',why:'Arquitectura exótica para espacios muy soleados.'},
 {id:'strelitzia',name:'Ave del paraíso',latin:'Strelitzia reginae',emoji:'🦜',where:'exterior',light:['sol','indirecta'],water:'medio',level:2,pet:'toxic',climates:['mediterraneo','islasmed','canarias'],care:'Protege de heladas, busca luz y riega más en crecimiento.',why:'Floración exótica en espacios templados.'},
 {id:'cica',name:'Cica',latin:'Cycas revoluta',emoji:'🌴',where:'exterior',light:['sol','indirecta'],water:'bajo',level:2,pet:'toxic',climates:['mediterraneo','islasmed','canarias'],care:'Suelo drenante, evitar heladas fuertes; extremadamente peligrosa si la ingieren mascotas.',why:'Silueta de aire prehistórico para jardines cálidos.'},
 {id:'jazmin',name:'Jazmín estrellado',latin:'Trachelospermum jasminoides',emoji:'🌼',where:'exterior',light:['sol','indirecta'],water:'medio',level:2,pet:'unknown',climates:['mediterraneo','oceano','continental','islasmed'],care:'Trepadora de buen drenaje, riega mientras se establece.',why:'Flores blancas perfumadas para muros y pérgolas.'},
 {id:'clivia',name:'Clivia',latin:'Clivia miniata',emoji:'🌼',where:'both',light:['indirecta','sombra'],water:'medio',level:2,pet:'toxic',climates:['oceano','mediterraneo','islasmed','canarias'],care:'Sombra luminosa, evita heladas y exceso de riego.',why:'Floración naranja intensa en sombra protegida.'},
 {id:'margarita',name:'Margarita',latin:'Argyranthemum frutescens',emoji:'🌼',where:'exterior',light:['sol'],water:'medio',level:1,pet:'unknown',climates:['mediterraneo','islasmed','canarias'],care:'Sol, riego moderado y protección de heladas fuertes.',why:'Mucha flor con poco esfuerzo en zonas templadas.'},
 {id:'palmito',name:'Palmito',latin:'Chamaerops humilis',emoji:'🌴',where:'exterior',light:['sol'],water:'bajo',level:1,pet:'unknown',climates:['mediterraneo','seco','islasmed'],care:'Sol y poco riego tras establecerse; resistente a sequía.',why:'Palmera mediterránea compacta y duradera.'},
 {id:'acebo',name:'Acebo',latin:'Ilex aquifolium',emoji:'🌳',where:'exterior',light:['indirecta','sombra'],water:'medio',level:2,pet:'toxic',climates:['oceano','frio'],care:'Prefiere humedad y frescor; las bayas son tóxicas.',why:'Hoja perenne para climas frescos y húmedos.'}
];

const survivorIds = ['aspidistra','sanse','zz','cinta','poto','haworthia','romero','tomillo','siempreviva','sedum'];
const survivorScore = {aspidistra:5,sanse:5,zz:5,cinta:4,poto:4,haworthia:5,romero:5,tomillo:5,siempreviva:5,sedum:5};
const survivorPhrase = {aspidistra:'Casi la campeona de la sombra.',sanse:'La sequía le molesta menos que el exceso de agua.',zz:'Olvídate un poco de ella y sigue tan lustrosa.',cinta:'Se multiplica cuando está a gusto.',poto:'Se adapta, pero no vive en oscuridad.',haworthia:'Pequeña, dura y sin dramas.',romero:'Sol, drenaje y poco teatro.',tomillo:'Le gusta la vida sencilla.',siempreviva:'Para rocallas y macetas con sol.',sedum:'Resiste donde otras se rinden.'};
const petLabel = state => state === 'ok' ? '🐾 Generalmente no tóxica para perros/gatos' : state === 'toxic' ? '⚠️ Puede ser tóxica para perros/gatos' : '🐾 Comprueba seguridad para tu mascota';
const waterLabel = {bajo:'Poco',medio:'Moderado',alto:'Frecuente'};
const lightLabel = {sol:'Sol',indirecta:'Luz indirecta',sombra:'Sombra'};
const form = $('form-plantas');
const provinceSelect = $('provincia');
const islandSelect = $('isla');
for (const [name] of provinces) provinceSelect.add(new Option(name,name));
$('year').textContent = new Date().getFullYear();

provinceSelect.addEventListener('change', () => {
 const entries = islands[provinceSelect.value];
 $('isla-field').hidden = !entries;
 islandSelect.replaceChildren();
 if (entries) for (const [name, kind] of entries) { const option=new Option(name,name); option.dataset.climate=kind; islandSelect.add(option); }
});

function resolveClimate(province, area) {
 const base = provinces.find(([name]) => name === province)?.[1] || 'continental';
 const islandChoice = islands[province] ? islandSelect.selectedOptions[0]?.dataset.climate : null;
 const initial = islandChoice || base;
 // Un ajuste prudente por zona: no pretendemos clasificar cada municipio.
 if (area === 'montana') return 'frio';
 if (area === 'costa') {
  if (initial === 'canarias' || initial === 'seco') return initial;
  if (initial === 'oceano') return 'oceano';
  return initial === 'islasmed' ? 'islasmed' : 'mediterraneo';
 }
 if (area === 'interior') {
  if (initial === 'canarias') return 'canarias';
  if (initial === 'oceano') return 'continental';
  if (initial === 'islasmed') return 'islasmed';
  if (initial === 'mediterraneo') return 'continental';
 }
 return initial;
}

function hasPlace(p, place){return p.where === place || p.where === 'both';}
function scorePlant(p, context) {
 if (!hasPlace(p,context.place)) return -100;
 if (context.pets && p.pet !== 'ok') return -100;
 if (context.place === 'exterior' && !p.climates?.includes(context.climate)) return -100;
 let score = 0;
 score += p.light.includes(context.light) ? 8 : -7;
 score += p.water === context.water ? 5 : context.water === 'bajo' && p.water === 'alto' ? -9 : -2;
 score += context.level === 'novato' ? (4-p.level)*2 : context.level === 'medio' ? 3-p.level : 0;
 if (p.where !== 'both') score += 1;
 return score;
}
function plantCard(p){
 return `<article class="plant-card"><span class="plant-emoji" aria-hidden="true">${p.emoji}</span><h3>${esc(p.name)}</h3><div class="botanical">${esc(p.latin)}</div><p>${esc(p.why)}</p><dl><div><dt>☀️ Luz</dt><dd>${p.light.map(k=>esc(lightLabel[k])).join(' · ')}</dd></div><div><dt>💧 Riego</dt><dd>${esc(waterLabel[p.water])}</dd></div><div><dt>🌱 Cuidado</dt><dd>${p.level === 1 ? 'Fácil' : 'Atención moderada'}</dd></div></dl><p><strong>Truco:</strong> ${esc(p.care)}</p><div class="${p.pet==='ok'?'pet-ok':'pet-alert'}">${petLabel(p.pet)}</div></article>`;
}
form.addEventListener('submit', event => {
 event.preventDefault();
 if (!form.reportValidity()) return;
 const province = provinceSelect.value;
 if (!province) return;
 const area = $('entorno').value;
 const climateKey=resolveClimate(province,area);
 const place=form.elements.lugar.value;
 const context={place,light:$('luz').value,level:$('experiencia').value,water:$('riego').value,pets:$('mascotas').checked,climate:climateKey};
 const all = plants.map(p=>({p,score:scorePlant(p,context)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score || a.p.name.localeCompare(b.p.name,'es'));
 const recommendations=all.slice(0,8).map(x=>x.p);
 const climateInfo=climate[climateKey];
 const loc = islands[province] ? `${islandSelect.value} (${province})` : province;
 const environment = area === 'general' ? 'zona habitual' : area === 'montana' ? 'sierra / altitud' : area === 'costa' ? 'costa' : 'interior';
 const results = $('resultados');
 results.innerHTML = `<div class="climate-box"><span class="eyebrow">TU RINCÓN EN EL MAPA</span><h2>${climateInfo.icon} ${esc(climateInfo.name)}</h2><p><strong>${esc(loc)}</strong> · ${esc(environment)}</p><p>${esc(climateInfo.desc)}</p><div class="climate-tags">${climateInfo.tags.map(t=>`<span>${esc(t)}</span>`).join('')}<span>${place==='interior'?'🏡 Interior':'🌞 Exterior'}</span></div></div>
 <h2>${recommendations.length?'Estas plantas tienen buena pinta para ti':'No tenemos una coincidencia segura'}</h2>
 <p class="micro">${recommendations.length ? 'Las opciones están ordenadas según luz, riego, experiencia y clima indicado. Las condiciones concretas de tu casa mandan.' : 'Prueba a cambiar la luz o el nivel de riego. No vamos a inventar una recomendación que no encaje.'}</p>
 ${recommendations.length ? `<div class="recommendations">${recommendations.map(plantCard).join('')}</div>` : ''}`;
 results.hidden=false;
 results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
});

$('survivor-grid').innerHTML = survivorIds.map((id,i)=>{
 const p=plants.find(item=>item.id===id);
 return `<article class="survivor"><div class="survivor-emoji" aria-hidden="true">${p.emoji}</div><h3>${i+1}. ${esc(p.name)}</h3><small>${p.where==='exterior'?'Exterior':p.where==='both'?'Interior o exterior protegido':'Interior'}</small><div class="stars" aria-label="Resistencia ${survivorScore[id]} de 5">${'★'.repeat(survivorScore[id])}${'☆'.repeat(5-survivorScore[id])}</div><p>${esc(survivorPhrase[id])}</p><p><strong>☀️</strong> ${p.light.map(k=>lightLabel[k]).join(' / ')}<br><strong>💧</strong> Riego ${waterLabel[p.water].toLowerCase()}</p><p>${esc(p.care)}</p><strong class="${p.pet==='ok'?'pet-ok':'pet-alert'}">${petLabel(p.pet)}</strong></article>`;
}).join('');
