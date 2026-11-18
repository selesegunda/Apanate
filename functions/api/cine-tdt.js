/** Cloudflare Pages Function. EPG de canales españoles en abierto, nunca programas pasados. */
const EPG_URLS = [
  'https://raw.githubusercontent.com/raulfdeztdo/epg/main/guide.xml',
  'https://epg-spain.netlify.app/guide.xml'
];
const CHANNEL_MATCH = /^(La 1|La 2|Antena 3|Telecinco|Cuatro|laSexta|la Sexta|FDF|Be Mad|BEMAD|Neox|Nova|Atreseries|TRECE|13 TV|Paramount Network|DKISS|DMAX|Mega|Energy|Divinity|Ten|TEN|Canal Sur|Canal Sur 2|TV3|33|À Punt|Aragón TV|ETB ?1|ETB ?2|TVG|Telemadrid|La Otra|7TV|CMM|Canal Extremadura|TPA|IB3|La 7|CyLTV|RTVC|RTVC Canarias|8TV|BOM Cine|BOM)$/i;
const movieCategory = /(?:pel[ií]cula|cine|largometraje|movie|film|filme|cinema|feature)/i;
function clean(s=''){return String(s).replace(/<!\[CDATA\[|\]\]>/g,'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim()}
function one(xml,tag){const m=xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));return m?clean(m[1]):''}
function attr(tag,name){const m=tag.match(new RegExp(`\\b${name}="([^"]+)"`));return m?m[1]:''}
function xmltvDate(v){const m=String(v).match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\s*([+-]\d{4})?/);if(!m)return NaN;const utc=Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+(m[6]||0));if(!m[7])return NaN;const sign=m[7][0]==='-'?-1:1;const offset=sign*(+m[7].slice(1,3)*60+(+m[7].slice(3,5)));return utc-offset*60000}
function inSpain(ts){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(ts)}
function readGuide(xml, now){
  const names=new Map();
  for(const m of xml.matchAll(/<channel\b([^>]*)>([\s\S]*?)<\/channel>/gi)){
    const id=attr(m[1],'id');const raw=one(m[2],'display-name').replace(/\s*(?:HD|SD|UHD|4K)$/i,'').trim();
    if(id && raw && CHANNEL_MATCH.test(raw.replace(/\s*\(.*?\)/g,'').trim()))names.set(id,raw);
  }
  const today=inSpain(new Date(now));const results=[];
  for(const m of xml.matchAll(/<programme\b([^>]*)>([\s\S]*?)<\/programme>/gi)){
    const ch=attr(m[1],'channel');if(!names.has(ch))continue;
    const ts=xmltvDate(attr(m[1],'start'));if(!Number.isFinite(ts)||ts<=now||inSpain(new Date(ts))!==today)continue;
    const body=m[2];
    const cats=[...body.matchAll(/<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi)].map(x=>clean(x[1]));
    if(!cats.some(x=>movieCategory.test(x)))continue;
    const titulo=one(body,'title');if(!titulo)continue;
    const canal=names.get(ch);
    results.push({titulo:titulo.slice(0,170),canal:canal.slice(0,55),inicio:new Date(ts).toISOString(),genero:cats[0]||'Película',fuente:'https://www.formulatv.com/programacion/'});
  }
  // Se priorizan las emisiones más cercanas, repartiendo la cartelera
  // entre canales: nunca más de dos películas por canal ni más de 12 en total.
  const uniq=new Set(), porCanal=new Map(), seleccion=[];
  for(const p of results.sort((a,b)=>a.inicio.localeCompare(b.inicio))){
    const clave=p.canal+'|'+p.inicio+'|'+p.titulo;
    if(uniq.has(clave))continue;
    uniq.add(clave);
    const canal=p.canal.toLocaleLowerCase('es').trim();
    if((porCanal.get(canal)||0)>=2)continue;
    seleccion.push(p);
    porCanal.set(canal,(porCanal.get(canal)||0)+1);
    if(seleccion.length===12)break;
  }
  return seleccion;
}
export async function onRequestGet({request}){
  const now=Date.now();
  for(const url of EPG_URLS){
    try{
      const response=await fetch(url,{headers:{'Accept':'application/xml,text/xml,*/*'},cf:{cacheTtl:300,cacheEverything:true}});
      if(!response.ok)continue;
      const xml=await response.text();if(!xml.includes('<programme'))continue;
      const peliculas=readGuide(xml,now);
      return new Response(JSON.stringify({peliculas,actualizado:new Date(now).toISOString(),origen:url}),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }catch(e){/* Prueba la segunda fuente EPG */}
  }
  return new Response(JSON.stringify({peliculas:[],error:'Guía TDT temporalmente no disponible'}),{status:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
}
