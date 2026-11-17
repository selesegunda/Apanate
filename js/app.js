 'use strict';
const $ = (id) => document.getElementById(id);
const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const money = value => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(value);
const recipes = [
  {name:'Tortilla de patatas',ingredients:['patata','huevo','aceite','sal'],optional:['cebolla']},
  {name:'Arroz blanco sencillo',ingredients:['arroz','agua','sal'],optional:['aceite']},
  {name:'Tomate aliñado',ingredients:['tomate','aceite','sal'],optional:['vinagre']},
  {name:'Huevo revuelto',ingredients:['huevo','aceite','sal'],optional:['leche']},
  {name:'Ensalada de tomate y atún',ingredients:['tomate','atun','aceite','sal'],optional:['cebolla']},
  {name:'Pasta con tomate',ingredients:['pasta','tomate','aceite','sal'],optional:['ajo']},
  {name:'Patatas cocidas',ingredients:['patata','agua','sal'],optional:['aceite']}
];
const plants = [
  {name:'Romero',place:'exterior',light:'sol',note:'Necesita buen drenaje. En maceta, vigila la humedad y el calor extremo.'},
  {name:'Lavanda',place:'exterior',light:'sol',note:'Prefiere mucha luz y sustrato drenante. Evita encharcar.'},
  {name:'Buganvilla',place:'exterior',light:'sol',note:'Agradece sol; requiere espacio y protección ante heladas.'},
  {name:'Helecho',place:'interior',light:'indirecta',note:'Prefiere luz indirecta y cierta humedad ambiental.'},
  {name:'Poto',place:'interior',light:'indirecta',note:'Evita el sol intenso; tóxico si se ingiere por mascotas.'},
  {name:'Aspidistra',place:'interior',light:'sombra',note:'Tolera poca luz, aunque no la oscuridad total.'},
  {name:'Sansevieria',place:'interior',light:'indirecta',note:'Riega poco; puede resultar tóxica para mascotas.'},
  {name:'Hiedra',place:'exterior',light:'sombra',note:'Necesita seguimiento de riego; tóxica si se ingiere.'}
];
const movies = [
  {name:'Toy Story',genre:'animacion',minutes:81},
  {name:'Mi vecino Totoro',genre:'animacion',minutes:86},
  {name:'El gran hotel Budapest',genre:'comedia',minutes:99},
  {name:'Regreso al futuro',genre:'ciencia ficcion',minutes:116},
  {name:'La llegada',genre:'ciencia ficcion',minutes:116},
  {name:'Intocable',genre:'comedia',minutes:112},
  {name:'La vida es bella',genre:'drama',minutes:116}
];
const books = [
  {name:'Don Quijote de la Mancha',author:'Miguel de Cervantes',genre:'clasico',lang:'es'},
  {name:'La sombra del viento',author:'Carlos Ruiz Zafón',genre:'novela',lang:'es'},
  {name:'La isla del tesoro',author:'Robert Louis Stevenson',genre:'aventura',lang:'otros'},
  {name:'Cien años de soledad',author:'Gabriel García Márquez',genre:'novela',lang:'es'},
  {name:'Orgullo y prejuicio',author:'Jane Austen',genre:'clasico',lang:'otros'},
  {name:'Viaje al centro de la Tierra',author:'Julio Verne',genre:'aventura',lang:'otros'}
];
function show(id,html){const target=$(id);if(target)target.innerHTML=html;}
$('year').textContent = new Date().getFullYear();
$('cocina-form').addEventListener('submit',event=>{
  event.preventDefault();
  const owned=new Set($('ingredientes').value.split(',').map(normalize).filter(Boolean));
  const available=recipes.filter(r=>r.ingredients.every(i=>owned.has(normalize(i))));
  const nearly=recipes.filter(r=>!available.includes(r)).map(r=>({...r,missing:r.ingredients.filter(i=>!owned.has(normalize(i)))})).filter(r=>r.missing.length<=2).sort((a,b)=>a.missing.length-b.missing.length);
  let html=available.length?'<strong>¡Puedes preparar esto!</strong><ul>'+available.map(r=>'<li>'+escapeHTML(r.name)+'</li>').join('')+'</ul>':'<strong>No encontramos una receta completa con esos ingredientes.</strong>';
  if(nearly.length)html+='<p><strong>Si también tienes...</strong></p><ul>'+nearly.slice(0,3).map(r=>'<li>'+escapeHTML(r.name)+' — falta: '+r.missing.map(escapeHTML).join(', ')+'</li>').join('')+'</ul>';
  html+='<p><small>Coincidencia por ingredientes, no comprueba cantidades, alérgenos ni instrucciones de preparación. Versión de muestra.</small></p>';
  show('cocina-resultado',html);
});
$('peliculas-form').addEventListener('submit',event=>{
  event.preventDefault();const g=$('genero').value,t=Number($('duracion').value);const found=movies.filter(m=>(g==='cualquiera'||m.genre===g)&&m.minutes<=t);
  show('peliculas-resultado',found.length?'<strong>Películas que encajan con los filtros</strong><ul>'+found.map(x=>'<li>'+escapeHTML(x.name)+' · '+x.minutes+' min</li>').join('')+'</ul><p><small>Datos de ejemplo. No indican disponibilidad en plataformas.</small></p>':'No hay títulos en nuestra pequeña muestra que cumplan esos filtros.');
});
$('libros-form').addEventListener('submit',event=>{
  event.preventDefault();const g=$('libro-genero').value,l=$('libro-idioma').value;const found=books.filter(b=>(g==='cualquiera'||b.genre===g)&&(l==='cualquiera'||b.lang===l));
  show('libros-resultado',found.length?'<strong>Lecturas para explorar</strong><ul>'+found.map(x=>'<li>'+escapeHTML(x.name)+' — '+escapeHTML(x.author)+'</li>').join('')+'</ul><p><small>Selección de ejemplo, no clasificación de libros más vendidos.</small></p>':'No hay coincidencias en esta selección inicial.');
});
