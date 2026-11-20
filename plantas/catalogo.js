'use strict';
(() => {
 const form = document.getElementById('catalogo-form');
 const input = document.getElementById('catalogo-q');
 const list = document.getElementById('catalogo-list');
 const status = document.getElementById('catalogo-status');
 if (!form || !input || !list || !status) return;
 const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const inMemory = new Map();
 const ttl = 30 * 60 * 1000;
 let current = 0;
 const safeSlug = s => /^[a-z0-9][a-z0-9-]{0,99}$/.test(String(s));
 const get = async path => {
   const val=inMemory.get(path);
   if (val && Date.now()-val.time<ttl) return val.data;
   const response = await fetch('/api/plantas?'+path, {headers:{accept:'application/json'}});
   const data = await response.json();
   if (!response.ok) throw Error(data.error || 'No se pudo consultar la API');
   inMemory.set(path,{data,time:Date.now()});return data;
 };
 function renderCare(p) {
   const c=p.care||{};
   const items=[];
   if (Number.isFinite(c.light)) items.push(`☀️ Luz: nivel botánico ${esc(c.light)} (escala de Trefle, no horas de sol)`);
   if (Number.isFinite(c.minimumTemperatureC)) items.push(`🌡️ Temperatura mínima registrada: ${esc(c.minimumTemperatureC)} °C`);
   if (Number.isFinite(c.maximumTemperatureC)) items.push(`🌡️ Temperatura máxima registrada: ${esc(c.maximumTemperatureC)} °C`);
   if (Number.isFinite(c.soilPhMin)||Number.isFinite(c.soilPhMax)) items.push(`🌱 pH de suelo: ${esc(c.soilPhMin ?? '?')}–${esc(c.soilPhMax ?? '?')}`);
   if (c.droughtTolerance) items.push(`💧 Tolerancia a sequía: ${esc(c.droughtTolerance)}`);
   if (c.frostTolerance) items.push(`❄️ Tolerancia al frío: ${esc(c.frostTolerance)}`);
   // Reutilizar el consejo ya contrastado de la selección original si coincide el nombre científico.
   const local = typeof plants !== 'undefined' && Array.isArray(plants)
     ? plants.find(x => x.latin?.toLowerCase() === p.scientificName?.toLowerCase()) : null;
   if (local) {
     const water={bajo:'Poco',medio:'Moderado',alto:'Frecuente'};
     const light={sol:'Sol',indirecta:'Luz indirecta',sombra:'Sombra'};
     items.unshift(`🌿 Cuidados de ¡Apañate!: ${esc(local.care)}`);
     items.push(`💧 Riego orientativo: ${water[local.water] || 'Sin especificar'}`);
     items.push(`☀️ Exposición: ${(local.light || []).map(k => light[k] || k).join(' · ')}`);
     if (local.pet === 'toxic') items.push('⚠️ Puede ser tóxica para perros o gatos');
     if (local.pet === 'ok') items.push('🐾 Generalmente no tóxica para perros o gatos');
   }
   const li=items.length?`<ul class="catalogo-care">${items.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<p>Esta especie no tiene todavía cuidados detallados verificados en la fuente.</p>';
   return `<h4>Características de cultivo disponibles</h4>${li}<p class="catalogo-disclaimer">Los datos botánicos no permiten deducir por sí solos la frecuencia de riego, la poda, el abono ni la seguridad para mascotas. Cuando existe, mostramos el consejo de la selección original de ¡Apañate!.</p><p class="catalogo-attribution">Datos: <a href="https://trefle.io/" target="_blank" rel="noopener noreferrer">Trefle</a> · CC BY 4.0 · ${esc(p.scientificName)}</p>`;
 }
 function cards(plants) {return plants.map(p=>`<article class="plant-card catalogo-card"><span class="plant-emoji" aria-hidden="true">🌱</span><h3>${esc(p.scientificName)}</h3><div class="botanical">${p.commonName?`Nombre común en la fuente: ${esc(p.commonName)}`:'Nombre común no disponible'}</div><p>Familia: ${esc(p.family||'Sin especificar')}</p><button type="button" class="catalogo-detail" data-slug="${esc(p.slug)}">Ver ficha y cuidados disponibles ↗</button><div class="catalogo-ficha" aria-live="polite" hidden></div></article>`).join('');}
 form.addEventListener('submit', async e => {
   e.preventDefault(); const q=input.value.trim(); if(q.length<2)return;
   const seq=++current;status.textContent='Buscando plantas…';list.innerHTML='';
   try {const data=await get('q='+encodeURIComponent(q)); if(seq!==current)return;
     list.innerHTML=data.plants?.length?cards(data.plants):'<p>No encontramos especies para esta búsqueda. Prueba con el nombre científico.';
     status.textContent=data.plants?.length?`${data.plants.length} plantas encontradas${data.hasMore?' (primera página)':''}. ${data.cache==='antigua'?'Datos guardados de una consulta anterior.':''}`:'No se encontraron plantas.';
   } catch(err) {if(seq===current) status.textContent=err.message;}
 });
 list.addEventListener('click', async e => {
   const btn=e.target.closest('button[data-slug]');if(!btn)return;
   const slug=btn.dataset.slug;if(!safeSlug(slug))return;
   const output=btn.parentElement.querySelector('.catalogo-ficha');
   if(!output.hidden){output.hidden=true;btn.textContent='Ver ficha y cuidados disponibles ↗';return;}
   btn.disabled=true;output.hidden=false;output.textContent='Consultando ficha…';
   try { const data=await get('id='+encodeURIComponent(slug));output.innerHTML=renderCare(data.plant);btn.textContent='Ocultar ficha ↑';if(data.cache==='antigua')output.insertAdjacentHTML('afterbegin','<p>Información guardada; puede estar desactualizada.</p>'); }
   catch(err){output.textContent=err.message;}
   finally{btn.disabled=false;}
 });
})();
