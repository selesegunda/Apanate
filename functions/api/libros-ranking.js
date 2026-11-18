/** ¡Apáñate! — consulta semanal del ranking de El Cultural.
 * No se generan puestos ficticios: si la fuente cambia, devuelve error y el
 * navegador mantiene la última edición verificable.
 */
const LIST_URL = 'https://www.elespanol.com/el-cultural/letras/los-libros-mas-vendidos/';
const HOST = 'https://www.elespanol.com';
const MONTHS = {enero:0, febrero:1, marzo:2, abril:3, mayo:4, junio:5, julio:6, agosto:7, septiembre:8, octubre:9, noviembre:10, diciembre:11};
function decode(s='') {
  return String(s).replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>{const x=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):parseInt(n,10);return Number.isFinite(x)?String.fromCodePoint(x):''})
    .replace(/&(amp|lt|gt|quot|apos|nbsp|aacute|eacute|iacute|oacute|uacute|ntilde|Aacute|Eacute|Iacute|Oacute|Uacute|Ntilde);/g,(_,n)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',aacute:'á',eacute:'é',iacute:'í',oacute:'ó',uacute:'ú',ntilde:'ñ',Aacute:'Á',Eacute:'É',Iacute:'Í',Oacute:'Ó',Uacute:'Ú',Ntilde:'Ñ'})[n]||'');
}
function plain(html) {
  return decode(html.replace(/<(script|style|nav|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,'')
    .replace(/<\/?(?:p|h[1-6]|div|li|section|article|figcaption|br|aside)\b[^>]*>/gi,'\n')
    .replace(/<[^>]+>/g,' ').replace(/\r/g,'').replace(/[\t ]+/g,' ')
    .split('\n').map(x=>x.trim()).filter(Boolean).join('\n'));
}
function discover(page) {
  const set=new Set();
  for(const m of page.matchAll(/(?:href|content)=["']([^"']*\/el-cultural\/letras\/los-libros-mas-vendidos\/(20\d{6})\/[^"'<>\s]+\.html)["']/gi)) {
    const url=new URL(decode(m[1]),HOST);
    if(url.hostname==='www.elespanol.com') set.add(url.href);
  }
  return [...set].sort((a,b)=>{
    const date=a=>a.match(/\/los-libros-mas-vendidos\/(20\d{6})\//)?.[1]||'';
    return date(b).localeCompare(date(a));
  })[0]||null;
}
function block(text, group) {
  const start=group==='ficcion'?/^Ficción\s*$/im:/^No ficción\s*$/im;
  const match=start.exec(text); if(!match) return [];
  let tail=text.slice(match.index+match[0].length);
  const next=group==='ficcion'?/^No ficción\s*$/im:/^Fuente:\s*/im;
  const end=next.exec(tail); if(end) tail=tail.slice(0,end.index);
  const lines=tail.split('\n').map(x=>x.trim()).filter(Boolean);
  const books=[], found=new Set();
  for(let i=0;i<lines.length-2;i++) {
    const rank=/^(\d{1,2})\.\s+(.{2,190})$/.exec(lines[i]);
    if(!rank) continue;
    const n=Number(rank[1]); if(n<1||n>20||found.has(n)) continue;
    const titulo=rank[2];
    const autor=lines[i+1];
    const details=lines.slice(i+2,i+5).find(x=>/Semana anterior\s*:/i.test(x)&&/Semanas en lista\s*:/i.test(x));
    if(!details||!autor||autor.length>145) continue;
    const p=details.match(/^(.*?)\s*\/\s*Semana anterior:\s*([\d-]+)\s*\/\s*Semanas en lista:\s*(\d+)/i);
    if(!p)continue;
    found.add(n);
    books.push({grupo:group,puesto:n,titulo,autor:autor.replace(/\s+/g,' '),editorial:p[1].trim(),semana_anterior:/^\d+$/.test(p[2])?Number(p[2]):null,semanas_en_lista:Number(p[3])});
  }
  return books.sort((a,b)=>a.puesto-b.puesto);
}
async function fetchHtml(url){
  const r=await fetch(url,{headers:{Accept:'text/html', 'User-Agent':'Mozilla/5.0 (compatible; ApanateCine/1.0)'},signal:AbortSignal.timeout(12000),cf:{cacheTtl:3600,cacheEverything:true}});
  if(!r.ok)throw new Error('Fuente no disponible');
  const txt=await r.text();if(txt.length>3_000_000)throw new Error('Página demasiado grande');
  return txt;
}
export async function onRequestGet() {
  try {
    const list=await fetchHtml(LIST_URL);
    const url=discover(list);
    if(!url)throw new Error('No se encontró edición de ranking');
    const raw=await fetchHtml(url);
    const text=plain(raw);
    const fiction=block(text,'ficcion'), nonfiction=block(text,'no-ficcion');
    if(fiction.length!==20||nonfiction.length!==20)throw new Error('La fuente no ofrece los 40 puestos verificables');
    const match=url.match(/\/los-libros-mas-vendidos\/(20\d{2})(\d{2})(\d{2})\//);
    if(!match)throw new Error('Fecha desconocida');
    const fecha=`${match[1]}-${match[2]}-${match[3]}`;
    const now=new Date(); if(new Date(fecha+'T12:00:00Z') > new Date(now.getTime()+86400000))throw new Error('Fecha futura');
    return new Response(JSON.stringify({fecha,url,fuente:'El Cultural / Todos Tus Libros',libros:[...fiction,...nonfiction]}),{
      headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
    });
  } catch(err) {
    return new Response(JSON.stringify({error:'No hay edición nueva verificable; conservar el último ranking'}),{
      status:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
    });
  }
}
