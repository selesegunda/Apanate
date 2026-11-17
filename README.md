# ¡Apañate! — prototipo gratuito

Web estática HTML + CSS + JavaScript, preparada para conectarse a Cloudflare Pages mediante GitHub. **Sin API de IA, backend ni suscripciones.**

## Para verla en local

Puedes abrir `index.html` en un navegador para una prueba rápida. Para reproducir las rutas como en producción, ejecuta en esta carpeta `python -m http.server 8000` y abre `http://localhost:8000`.

## Publicación gratuita

1. Crea un repositorio nuevo en GitHub y sube **el contenido** de esta carpeta a la raíz del repositorio.
2. En Cloudflare, ve a Workers & Pages → Create → Pages → Import an existing Git repository y autoriza el repositorio.
3. Elige un proyecto estático sin framework; deja el comando de compilación vacío. Directorio de salida: `/` (raíz del proyecto, según el asistente de Cloudflare).
4. Despliega. Recibirás una dirección `*.pages.dev`, sujeta a disponibilidad.
5. Cada cambio confirmado en la rama conectada provocará un nuevo despliegue.

Los nombres de menú pueden variar. Revisa las cuotas y condiciones vigentes de los planes gratuitos.

## Qué funciona ahora

- Cocina: coincidencia simple de ingredientes en 7 recetas de muestra.
- Plantas: recomendaciones de muestra según interior/exterior y cantidad de luz.
- Películas: filtros por género y duración sobre una muestra pequeña, **sin comprobar dónde verlas**.
- Libros: filtros por género e idioma original; **no son rankings de ventas**.
- Dinero: cálculo de presupuesto restante.
- Viajes: cálculo de presupuesto restante para una escapada.

**Importante:** es una demostración funcional, no un servicio con catálogos completos ni recomendaciones verificadas para decisiones importantes. No publicar como contenido definitivo datos o afirmaciones de muestra.

## Próxima fase

- Crear colecciones de datos con fuentes, licencias y fecha de actualización.
- Construir páginas útiles basadas en consultas específicas y comprobables.
- Mejorar recetas: cantidades, sustituciones, instrucciones y alérgenos.
- Integrar clima/orientación/localidad para plantas, con criterios expertos.
- Comprobar derechos de reutilización de datos de películas y libros.
- Añadir analítica de privacidad adecuada y revisar requisitos legales.
- No indexar contenido incompleto como si fuese definitivo.
- Cuando se evalúe monetizar: dominio propio, revisión legal, AdSense y migración SEO.

Consulta `docs/PROYECTO.md` para las decisiones de alcance.
