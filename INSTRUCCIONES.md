# Andalucía · archivo definitivo para ¡Apañate!

Archivo destinado al repositorio **selesegunda/Apanate**, ruta `functions/api/planes-gratis.js`.

Se ha partido del archivo **planes-gratis-2.js** que acabas de enviar, conservando todas sus funciones existentes y añadiendo únicamente la lectura en D1 para Andalucía. **El nombre correcto de destino es planes-gratis.js, sin -2.**

## Antes de publicar

1. En Cloudflare Pages de la web (no en el Worker importador), enlaza la D1 **apanate-actividades** con nombre de variable **ACTIVIDADES_DB**. Si no se hace, la web seguirá usando su lector antiguo de la Junta.
2. En el GitHub de la **web** (`selesegunda/Apanate`), sustituye únicamente `functions/api/planes-gratis.js` por el del ZIP. No subas el archivo con `-2`.
3. Comprueba el despliegue de Pages y la carga de Andalucía. No modifiques el Worker importador ni las bases de datos.

## Comportamiento y límites

- Solo SELECT a D1, sin escrituras. La fuente existente en D1 conserva los 906 registros.
- Clasifica de forma conservadora actividades culturales y excluye convocatorias y jornadas profesionales evidentes.
- El campo oficial `date_registration` puede mezclar inscripción y celebración; los resultados de Andalucía se etiquetan como fechas por confirmar.
- No inventa gratuidad, provincia ni localidad. Los eventos sin localidad o enlace oficial se omiten.
- El sitio conserva su política actual de visualización; si muestra precios pendientes, esos eventos no se presentarán como gratis confirmados.
- No se ha conectado a tu Cloudflare ni publicado automáticamente.

## Comprobar

`node --test tests/andalucia-d1.test.mjs`
