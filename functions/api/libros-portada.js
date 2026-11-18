/** Portadas para ¡Apáñate!: ISBN, Open Library y Google Books.
 * Nunca devuelve una portada si no puede comprobar la identidad del libro.
 * Respuesta con caché en el navegador y en la CDN; sin claves privadas.
 */
const OL='https://openlibrary.org';
function norm(value='') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function isbnNorm(s=''){return String(s).replace(/[^0-9X]/gi,'').toUpperCase();}
function sameTitle(requested, found){
  const a=norm(requested), b=norm(found);
  if(!a||!b)return false;
  if(a===b)return true;
  // Subtítulos y coletillas editoriales: exigir un comienzo reconocible.
  const shorter=a.length<b.length?a:b, longer=a.length<b.length?b:a;
  return shorter.length>=12&&longer.startsWith(shorter+' ');
}
function sameAuthor(requested, authors){
  const a=norm(requested).split(' ').filter(Boolean);
  if(!a.length||!Array.isArray(authors))return false;
  const significant=a.filter(x=>x.length>=3&&!['del','las','los','de'].includes(x));
  if(!significant.length)return false;
  return authors.some(v=>{
    const parts=norm(v).split(' ');
    return significant.length===1?parts.includes(significant[0]):significant.slice(-2).every(x=>parts.includes(x));
  });
}
async function json(url){
  const res=await fetch(url,{signal:AbortSignal.timeout(8500),cf:{cacheTtl:86400,cacheEverything:true}});
  if(!res.ok)return null;
  return res.json();
}
function secureImage(url){
  if(!url)return '';
  try {
    const u=new URL(String(url).replace(/^http:/,'https:'));
    if(u.protocol!=='https:'||!['books.google.com','books.google.es','books.googleusercontent.com','covers.openlibrary.org'].includes(u.hostname))return '';
    return u.href;
  }catch{return '';}
}
async function fetchImage(url){
  const safe=secureImage(url);if(!safe)return null;
  const res=await fetch(safe,{signal:AbortSignal.timeout(8500),cf:{cacheTtl:604800,cacheEverything:true}});
  if(!res.ok)return null;
  const type=(res.headers.get('Content-Type')||'').split(';')[0].trim();
  if(!['image/jpeg','image/png','image/webp'].includes(type))return null;
  const body=await res.arrayBuffer();
  if(body.byteLength<2500||body.byteLength>1500000)return null;
  return {body,type};
}
async function openLibraryByISBN(isbn){
  if(!isbn)return [];
  const metadata=await json(`${OL}/isbn/${encodeURIComponent(isbn)}.json`).catch(()=>null);
  return metadata?.covers?.slice(0,3).map(id=>`https://covers.openlibrary.org/b/id/${id}-M.jpg?default=false`)||[];
}
async function googleBooks(isbn,titulo,autor,byISBN){
  const query=byISBN?`isbn:${isbn}`:`intitle:${titulo} inauthor:${autor}`;
  const data=await json(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books`).catch(()=>null);
  const result=[];
  for(const item of data?.items||[]){
    const v=item.volumeInfo||{};
    if(!v.imageLinks)continue;
    const identifiers=(v.industryIdentifiers||[]).map(x=>isbnNorm(x.identifier));
    if(byISBN){if(!identifiers.includes(isbn))continue;}
    else if(!sameTitle(titulo,v.title)&&!sameTitle(titulo,`${v.title||''} ${v.subtitle||''}`))continue;
    if(!byISBN&&!sameAuthor(autor,v.authors||[]))continue;
    const img=v.imageLinks.thumbnail||v.imageLinks.smallThumbnail;
    if(img)result.push(img);
  }
  return result;
}
async function openLibrarySearch(titulo,autor){
  const data=await json(`${OL}/search.json?limit=20&fields=title,author_name,cover_i,isbn&title=${encodeURIComponent(titulo)}&author=${encodeURIComponent(autor)}`).catch(()=>null);
  const results=[];
  for(const doc of data?.docs||[]){
    if(!doc.cover_i||!sameTitle(titulo,doc.title)||!sameAuthor(autor,doc.author_name))continue;
    results.push(`https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg?default=false`);
  }
  return results;
}
async function firstGood(urls){
  for(const url of urls){try{const photo=await fetchImage(url);if(photo)return photo;}catch{}}
  return null;
}
export async function onRequestGet({request}){
  const q=new URL(request.url).searchParams;
  const titulo=(q.get('titulo')||'').trim().slice(0,180);
  const autor=(q.get('autor')||'').trim().slice(0,140);
  const isbn=isbnNorm(q.get('isbn')||'');
  if(titulo.length<2||autor.length<2||isbn.length>13)return new Response('Solicitud no válida',{status:400});
  const notFound=()=>new Response('',{status:404,headers:{'Cache-Control':'public, max-age=3600'}});
  try{
    // 1. La edición exacta, si tenemos ISBN.
    if(isbn.length===10||isbn.length===13){
      const byOL=await firstGood(await openLibraryByISBN(isbn).catch(()=>[]));
      if(byOL)return imageResponse(byOL);
      const byGoogle=await firstGood(await googleBooks(isbn,titulo,autor,true));
      if(byGoogle)return imageResponse(byGoogle);
    }
    // 2. Búsqueda por título y autor, con verificación de identidad.
    const byTitleOL=await firstGood(await openLibrarySearch(titulo,autor));
    if(byTitleOL)return imageResponse(byTitleOL);
    const byTitleGoogle=await firstGood(await googleBooks('',titulo,autor,false));
    if(byTitleGoogle)return imageResponse(byTitleGoogle);
    return notFound();
  }catch{return new Response('',{status:503,headers:{'Cache-Control':'no-store'}});}
}
function imageResponse(photo){
  return new Response(photo.body,{headers:{'Content-Type':photo.type,'Cache-Control':'public, max-age=604800','X-Content-Type-Options':'nosniff'}});
}
