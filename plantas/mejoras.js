'use strict';
// Capa adicional: no modifica la selección ni la lógica climática de plantas/app.js.
(() => {
 const $ = id => document.getElementById(id);
 const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const STORAGE_KEY = 'apanate-mi-jardin-v1';
 let saved = [];
 let storageAvailable = true;
 try { const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); if (Array.isArray(data)) saved = data.filter(p=>p && typeof p.id==='string' && typeof p.name==='string').slice(0,100); }
 catch (_) { storageAvailable = false; }
 const persist = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); storageAvailable=true; } catch (_) { storageAvailable=false; } };
 const keyFor = (kind, id) => kind + ':' + id;
 const findSaved = key => saved.some(x=>x.id===key);
 const buttonLabel = key => findSaved(key) ? '♥ Guardada en mi jardín' : '♡ Guardar en mi jardín';
 function toggle(entry) {
   if (findSaved(entry.id)) saved = saved.filter(x=>x.id!==entry.id);
   else {saved.unshift(entry); saved=saved.slice(0,100);}
   persist(); renderGarden(); syncButtons();
 }
 function syncButtons() {
   document.querySelectorAll('[data-plant-favorite]').forEach(btn=>{
     const isSaved=findSaved(btn.dataset.plantFavorite);
     btn.textContent=buttonLabel(btn.dataset.plantFavorite);
     btn.setAttribute('aria-pressed',String(isSaved));
   });
 }
 function renderGarden() {
   const area=$('mi-jardin-list'); if (!area) return;
   const note=$('mi-jardin-status');
   note.textContent = storageAvailable ? 'Guardado en este navegador, sin registro ni envío de datos personales.' : 'Tu navegador no permite guardar datos de forma permanente; las favoritas pueden perderse al cerrar la página.';
   if(!saved.length) {area.innerHTML='<p class="micro">Todavía no has guardado ninguna planta. Usa el corazón de una recomendación o del catálogo.</p>'; return;}
   area.innerHTML=saved.map(p=>`<article class="garden-entry"><div><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.latin||'')}</small><span>${p.kind==='local'?'Recomendación con cuidados de ¡Apañate!':'Especie del catálogo Trefle · cuidados según disponibilidad'}</span></div><div class="garden-actions"><button type="button" class="garden-open" data-open-plant="${escapeHTML(p.id)}">Ver en la página</button><button type="button" class="garden-remove" data-remove-plant="${escapeHTML(p.id)}" aria-label="Quitar ${escapeHTML(p.name)} de mi jardín">Quitar</button></div></article>`).join('');
 }
 function localEntry(p) { return { id:keyFor('local',p.id),kind:'local', name:p.name, latin:p.latin||'', savedAt:new Date().toISOString() }; }
 function trefleEntry(card) {return {id:keyFor('trefle',card.dataset.trefleSlug), kind:'trefle',name:card.dataset.trefleName,latin:card.dataset.trefleName,savedAt:new Date().toISOString()};}
 function addLocalCardFeatures() {
   const container=$('resultados');
   if (!container || !Array.isArray(typeof plants==='undefined'?null:plants)) return;
   const cards=Array.from(container.querySelectorAll('.recommendations > .plant-card'));
   cards.slice(6).forEach(card=>card.remove());
   const selected=cards.slice(0,6);
   const context={water:$('riego')?.value, light:$('luz')?.value,pets:$('mascotas')?.checked,place:document.querySelector('input[name="lugar"]:checked')?.value,level:$('experiencia')?.value,province:$('provincia')?.value,zone:$('entorno')?.value,space:$('tipo-rincon')?.value};
   const titles={'sol':'sol directo','indirecta':'luz indirecta','sombra':'poca luz'};
   selected.forEach((card,index)=>{
     const title=card.querySelector('h3')?.textContent?.trim();
     const p=plants.find(x=>x.name===title);
     if(!p)return;
     const why=[];
     if(p.light.includes(context.light)) why.push('encaja con la luz indicada');
     if(p.water===context.water) why.push('su necesidad de agua coincide con tu preferencia');
     if(context.level==='novato' && p.level===1)why.push('es de cuidado sencillo');
     if(context.pets && p.pet==='ok')why.push('figura como generalmente no tóxica en el catálogo actual');
     if(context.place==='exterior')why.push('está incluida para el grupo climático orientativo de tu zona');
     const rationale=why.length?'La proponemos porque '+why.join('; ')+'.':'La proponemos entre las especies compatibles del catálogo actual.';
     const watering='En España, adapta el riego a la estación: comprueba la humedad del sustrato antes de regar y evita que quede agua acumulada en el plato. En verano las macetas expuestas pueden secarse antes; en invierno suelen tardar más.';
     const setting=context.space==='balcon'?'En un balcón, vigila viento y secado rápido de macetas pequeñas.':context.space==='terraza'?'En terraza, revisa el calor que acumula el pavimento y el viento.':context.space==='jardin'?'En jardín, comprueba las condiciones de tu suelo y las heladas de tu localidad.':context.space==='patio'?'En patio, observa las horas reales de luz entre edificios.':context.space==='salon'?'En salón, evita radiadores, corrientes de aire y cambios bruscos.':context.space==='dormitorio'?'En dormitorio, prioriza la luz natural adecuada y evita rincones totalmente oscuros.':'';
     const k=keyFor('local',p.id);
     const fragment=document.createElement('div');fragment.className='extra-care';
     fragment.innerHTML=`<p class="match-why"><strong>Por qué encaja:</strong> ${escapeHTML(rationale)}</p><details><summary>Guía práctica de cuidados</summary><p><strong>Consejo de la planta:</strong> ${escapeHTML(p.care)}</p><p><strong>Riego en España:</strong> ${escapeHTML(watering)}</p>${setting?`<p><strong>Tu rincón:</strong> ${escapeHTML(setting)}</p>`:''}<p><strong>Antes de comprar:</strong> comprueba heladas, orientación y disponibilidad en tu zona. ${p.pet==='unknown'?'La seguridad para mascotas no está confirmada.':''}</p></details><button type="button" class="plant-fav" data-plant-favorite="${escapeHTML(k)}" data-local-id="${escapeHTML(p.id)}" aria-pressed="${String(findSaved(k))}">${buttonLabel(k)}</button>`;
     card.append(fragment);
   });
   const heading=container.querySelector('.recommendations')?.previousElementSibling;
   if(heading && heading.matches('.micro')) heading.insertAdjacentHTML('beforeend',' <strong>Mostramos hasta seis recomendaciones.</strong>');
   const n=$('rincon-contexto'); if(n){const msg=context.space==='ninguno'?'':` · Espacio: ${{balcon:'balcón',terraza:'terraza',patio:'patio',jardin:'jardín',salon:'salón',dormitorio:'dormitorio'}[context.space]||'sin especificar'}`;n.textContent='Provincia: '+context.province+msg+'. La provincia orienta, pero no sustituye el clima de tu localidad.';}
   syncButtons();
 }
 const form=$('form-plantas');
 if (form) form.addEventListener('submit', () => { if(form.checkValidity()) addLocalCardFeatures(); });
 document.addEventListener('click', e=>{
   const btn=e.target.closest('[data-plant-favorite]');
   if(btn){
     const id=btn.dataset.localId; const card=btn.closest('[data-trefle-slug]');
     if(id){const p=typeof plants!=='undefined'&&Array.isArray(plants)?plants.find(x=>x.id===id):null;if(p)toggle(localEntry(p));}
     else if(card && card.dataset.trefleSlug && card.dataset.trefleName) toggle(trefleEntry(card));
     return;
   }
   const remove=e.target.closest('[data-remove-plant]'); if(remove){saved=saved.filter(x=>x.id!==remove.dataset.removePlant);persist();renderGarden();syncButtons();return;}
   const open=e.target.closest('[data-open-plant]'); if(open){
     const key=open.dataset.openPlant;
     const local=key.startsWith('local:');
     const target=local?document.querySelector(`[data-local-id="${CSS.escape(key.slice(6))}"]`):document.querySelector(`[data-trefle-slug="${CSS.escape(key.slice(7))}"]`);
     if(target) {target.scrollIntoView({behavior:'smooth',block:'center'});return;}
     if(local){$('buscador')?.scrollIntoView({behavior:'smooth'});$('mi-jardin-status').textContent='Esta recomendación no está visible: vuelve a realizar la búsqueda para verla.';}
     else {const input=$('catalogo-q');if(input){input.value=(saved.find(x=>x.id===key)?.name)||'';$('catalogo-form')?.requestSubmit();$('catalogo')?.scrollIntoView({behavior:'smooth'});}}
   }
 });
 // El catálogo se genera después de una búsqueda: agregar el botón por tarjeta sin consultar otra API.
 const catalogue=$('catalogo-list');
 if(catalogue){
   const decorate=()=>{
     catalogue.querySelectorAll('.catalogo-card:not([data-fav-ready])').forEach(card=>{
       const slug=card.querySelector('[data-slug]')?.dataset.slug;
       const name=card.querySelector('h3')?.textContent?.trim();
       if(!slug||!name)return;
       card.dataset.trefleSlug=slug;card.dataset.trefleName=name;
       const k=keyFor('trefle',slug);
       const btn=document.createElement('button');btn.type='button';btn.className='plant-fav';btn.dataset.plantFavorite=k;btn.setAttribute('aria-pressed',String(findSaved(k)));btn.textContent=buttonLabel(k);
       card.append(btn);card.dataset.favReady='1';
     });
   };
   const observer=new MutationObserver(decorate);observer.observe(catalogue,{childList:true,subtree:false});decorate();
 }
 renderGarden();
})();
