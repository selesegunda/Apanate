/** Portada gratuita encontrada por título y autor en Open Library.
 * No inventa cubiertas ni las asocia por una coincidencia vaga.
 */
function norm(s=''){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
export async function onRequestGet({request}) {
  const q=new URL(request.url).searchParams;
  const titulo=(q.get('titulo')||'').slice(0,120).trim();
  const autor=(q.get('autor')||'').slice(0,100).trim();
  if(titulo.length<2||autor.length<2)return new Response('Parámetros incorrectos',{status:400});
  try {
    const url='https://openlibrary.org/search.json?limit=5&fields=title,author_name,cover_i,isbn&title='+encodeURIComponent(titulo)+'&author='+encodeURIComponent(autor);
    const r=await fetch(url,{signal:AbortSignal.timeout(9000),cf:{cacheTtl:86400,cacheEverything:true}});
    if(!r.ok)throw new Error('Busqueda no disponible');
    const data=await r.json();
    const hits=(data.docs||[]).filter(x=>x.cover_i&&norm(x.title)===norm(titulo)&&Array.isArray(x.author_name)&&x.author_name.some(a=>norm(a).includes(norm(autor).split(' ')[0])));
    if(!hits.length)return new Response('',{status:404,headers:{'Cache-Control':'public, max-age=3600'}});
    const cover='https://covers.openlibrary.org/b/id/'+hits[0].cover_i+'-M.jpg?default=false';
    const image=await fetch(cover,{signal:AbortSignal.timeout(10000),cf:{cacheTtl:604800,cacheEverything:true}});
    if(!image.ok)throw new Error('Imagen no disponible');
    const contentType=image.headers.get('Content-Type')||'';
    if(!contentType.startsWith('image/'))throw new Error('No es una imagen');
    const dataBytes=await image.arrayBuffer();
    if(dataBytes.byteLength>1_000_000)throw new Error('Imagen grande');
    return new Response(dataBytes,{headers:{'Content-Type':contentType,'Cache-Control':'public, max-age=604800','X-Content-Type-Options':'nosniff'}});
  }catch(_){return new Response('',{status:503,headers:{'Cache-Control':'no-store'}})}
}
