/** ¡Apáñate! · Cubiertas verificadas con alternativas ISBN y título/autor.
 * Sin coincidencia fiable se responde 404: el navegador conserva su aviso original.
 */
const OL='https://openlibrary.org';
const GOOGLE='https://www.googleapis.com/books/v1/volumes';
function norm(s=''){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function isbnNorm(s=''){return String(s).replace(/[^0-9X]/gi,'').toUpperCase()}
function authorMatches(a,list){
  if(!a||!Array.isArray(list)||!list.length)return false;
  const words=norm(a).split(' ').filter(w=>w.length>2&&!['del','las','los'].includes(w));
  if(!words.length)return false;
  const surname=words[words.length-1];
  return list.some(author=>norm(author).split(' ').includes(surname));
}
function titleMatches(a,b){
  const x=norm(a),y=norm(b);if(!x||!y)return false;
  if(x===y)return true;
  const short=x.length<y.length?x:y,long=x.length<y.length?y:x;
  return short.length>=9 && (long.startsWith(short+' ') || long.includes(' '+short+' ') || (short.length>=14 && long.includes(short)));
}
async function getJSON(url){
  try{const r=await fetch(url,{signal:AbortSignal.timeout(9000),cf:{cacheTtl:86400,cacheEverything:true}});if(r.ok)return await r.json();}catch(_){ }
  return null;
}
function imgUrl(u){
  try{
    const v=new URL(String(u).replace(/^http:/,'https:'));
    const hosts=new Set(['covers.openlibrary.org','books.google.com','books.google.es','books.googleusercontent.com','books.google.co.uk','encrypted-tbn0.gstatic.com']);
    return v.protocol==='https:'&&hosts.has(v.hostname)?v.toString():'';
  }catch{return '';}
}
async function getImage(url){
  const safe=imgUrl(url);if(!safe)return null;
  try{
    const r=await fetch(safe,{signal:AbortSignal.timeout(9500),cf:{cacheTtl:604800,cacheEverything:true}});
    if(!r.ok)return null;
    const type=(r.headers.get('content-type')||'').split(';')[0].trim();
    if(!['image/jpeg','image/png','image/webp'].includes(type))return null;
    const data=await r.arrayBuffer();
    if(data.byteLength<1000||data.byteLength>3000000)return null;
    return {data,type};
  }catch{return null;}
}
async function olSearch(title,author){
  const urls=[
    `${OL}/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&fields=title,author_name,cover_i,isbn&limit=30`,
    `${OL}/search.json?q=${encodeURIComponent(title+' '+author)}&fields=title,author_name,cover_i,isbn&limit=30`
  ];
  const out=[];
  for(const u of urls){
    const j=await getJSON(u); if(!j)continue;
    for(const item of j.docs||[]){
      if(item.cover_i&&titleMatches(title,item.title)&&authorMatches(author,item.author_name))out.push(`https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg?default=false`);
    }
    if(out.length)break;
  }
  return out;
}
async function gbSearch(query,title,author,isbn=''){
  const j=await getJSON(`${GOOGLE}?q=${encodeURIComponent(query)}&maxResults=20&printType=books`);
  const out=[];
  for(const item of j?.items||[]){
    const v=item.volumeInfo||{},image=v.imageLinks?.thumbnail||v.imageLinks?.smallThumbnail;
    if(!image)continue;
    const ids=(v.industryIdentifiers||[]).map(i=>isbnNorm(i.identifier));
    if(isbn && ids.includes(isbn)){
      // ISBN exacto: la ficha de Google identifica la edición.
    }else if(!titleMatches(title,v.title)&&!titleMatches(title,`${v.title||''} ${v.subtitle||''}`)){
      continue;
    }else if(!authorMatches(author,v.authors)){
      continue;
    }
    out.push(String(image).replace(/^http:/,'https:'));
  }
  return out;
}
async function firstImage(urls){
  const seen=new Set();
  for(const url of urls){if(seen.has(url))continue;seen.add(url);const x=await getImage(url);if(x)return x;}
  return null;
}
function imageResponse(photo){return new Response(photo.data,{headers:{'Content-Type':photo.type,'Cache-Control':'public, max-age=604800','X-Content-Type-Options':'nosniff'}})}
export async function onRequestGet({request}){
  const q=new URL(request.url).searchParams;
  const title=(q.get('titulo')||'').trim().slice(0,180),author=(q.get('autor')||'').trim().slice(0,140),isbn=isbnNorm(q.get('isbn')||'');
  if(title.length<2||author.length<2||isbn.length>13)return new Response('',{status:400});
  try{
    if(isbn.length===10||isbn.length===13){
      // Intento directo con el ISBN antes de depender del catálogo Open Library.
      let image=await firstImage([`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`]);
      if(image)return imageResponse(image);
      const edition=await getJSON(`${OL}/isbn/${encodeURIComponent(isbn)}.json`);
      image=await firstImage((edition?.covers||[]).slice(0,3).map(id=>`https://covers.openlibrary.org/b/id/${id}-M.jpg?default=false`));
      if(image)return imageResponse(image);
      image=await firstImage(await gbSearch(`isbn:${isbn}`,title,author,isbn));
      if(image)return imageResponse(image);
    }
    // Para títulos nuevos sin ISBN: Open Library y Google Books con cotejo de autor/título.
    let image=await firstImage(await olSearch(title,author));
    if(image)return imageResponse(image);
    image=await firstImage(await gbSearch(`intitle:${title} inauthor:${author}`,title,author));
    if(image)return imageResponse(image);
    // Una búsqueda general tolera los subtítulos y variantes de nombres.
    image=await firstImage(await gbSearch(`${title} ${author}`,title,author));
    if(image)return imageResponse(image);
    return new Response('',{status:404,headers:{'Cache-Control':'public, max-age=900'}});
  }catch(_){return new Response('',{status:503,headers:{'Cache-Control':'no-store'}})}
}
