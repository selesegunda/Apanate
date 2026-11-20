/**
 * ¡Apañate! Libros · asociación de 7 portadas locales nuevas.
 * No borra ni sustituye otras portadas del depósito existente.
 * Solo intercepta GET /api/libros-portada para los ISBN indicados.
 * Si no coincide, deja pasar la petición al sistema actual.
 */
const LOCAL_COVERS = Object.freeze({
  '9791387740566': '/libros/portadas/el-hombre-que-solo-escribia-en-los-aviones.jpg',
  '9788417553036': '/libros/portadas/el-verano-en-que-mi-madre-tuvo-los-ojos-verdes.jpg',
  '9788408328858': '/libros/portadas/la-anoranza.jpg',
  '9788408328834': '/libros/portadas/la-hora-antes-del-alba.gif',
  '9791388236013': '/libros/portadas/no-puedes-quedarte-aqui-eternamente.jpg',
  '9788419981400': '/libros/portadas/vidas-con-nombre.jpg',
  '9788433949615': '/libros/portadas/dame-veneno-que-quiero-vivir.jpg'
});
function cleanIsbn(value) {
  return String(value || '').replace(/[^0-9X]/gi, '').toUpperCase();
}
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.pathname !== '/api/libros-portada') return next();
  const isbn = cleanIsbn(url.searchParams.get('isbn'));
  const localPath = LOCAL_COVERS[isbn];
  if (!localPath || !env?.ASSETS?.fetch) return next();
  try {
    const assetUrl = new URL(localPath, url.origin);
    const assetResponse = await env.ASSETS.fetch(new Request(assetUrl.toString(), { method: 'GET' }));
    const type = (assetResponse.headers.get('content-type') || '').toLowerCase();
    if (!assetResponse.ok || !type.startsWith('image/')) return next();
    const headers = new Headers(assetResponse.headers);
    headers.set('Cache-Control', 'public, max-age=604800');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(assetResponse.body, { status: 200, headers });
  } catch (_) {
    return next();
  }
}
