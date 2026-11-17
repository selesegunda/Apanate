# Especificación de proyecto: ¡Apañate!

## Idea

Web de herramientas prácticas para aprovechar lo que ya tienes (comida, espacio, tiempo y dinero) y descubrir opciones de ocio. El resultado valioso procede de combinar datos y reglas útiles, no de copiar fichas.

## Decisiones

- Estética alegre, cálida, accesible y moderna. Paleta crema, amarillo, coral, verde, lila y azul claro. No mostrar ninguna etiqueta de estilo geográfico en la web.
- GitHub gratuito como repositorio; Cloudflare Pages en plan gratuito para pruebas.
- Dirección `*.pages.dev` provisional, dominio propio solo si la medición justifica monetización posterior.
- Sin IA por consulta ni servicios con costes variables por visita.
- Seis áreas: cocina, plantas, películas, libros, dinero y viajes.
- Primero hacer funcionar cada herramienta con datos acotados y honestamente señalados; después ampliar con datos externos y licencias verificadas.
- Originalidad: filtros + cálculos + explicaciones de por qué una opción sirve, limitaciones y fuentes.
- SEO: solo publicar páginas con consultas plausibles y diferenciación real. Evitar combinaciones masivas y contenido duplicado.
- Analítica gratuita y respetuosa con la privacidad cuando esté lista la política legal.
- Revisar condiciones de datos, anuncios, consentimiento y requisitos legales antes del lanzamiento público definitivo.

## Funcionalidad objetivo

1. **Cocina:** ingredientes y cantidades disponibles → recetas factibles, sustituciones, utensilios, tiempo y alérgenos.
2. **Plantas:** ubicación, orientación, tipo de espacio, luz, clima y mascotas → plantas y ubicación recomendada.
3. **Películas:** gustos, duración, país y coste → opciones y disponibilidad legal comprobada con fuente autorizada.
4. **Libros:** género, idioma original, autor y rankings autorizados → recomendaciones y clasificaciones verificadas.
5. **Dinero:** presupuesto y prioridades → cálculos objetivos, ahorro y comparaciones sin asesoramiento financiero personalizado.
6. **Viajes:** límite de gasto, disponibilidad y preferencias → opciones realistas; la información comercial debe tener vigencia clara.

## Principio de mantenimiento

Preferir HTML estático, datos versionados (JSON) y filtrado local en JS. Automatizar importaciones solo cuando las fuentes permitan usos comerciales y sean fiables. Monitorizar fallos; nunca asumir que las APIs externas permanecerán gratuitas indefinidamente.

## Prioridades de prueba

1. Identidad visual y navegación móvil.
2. Cocina y presupuesto, porque son fáciles de demostrar con datos y reglas.
3. Plantas con datos locales contrastados.
4. Películas y libros con licencias claras.
5. Viajes con cálculos inicialmente manuales.
6. Analítica de uso, medición orgánica y decisión sobre monetización/dominio.

## Riesgos

- Que una página generada no aporte valor y no indexe bien.
- Licencias y cuotas de APIs de catálogos comerciales.
- Recomendaciones botánicas erróneas o incompletas.
- Datos comerciales obsoletos.
- Falta de privacidad, aviso legal o consentimiento si se activan servicios externos.
- Cambio de dominio: requiere estrategia de redirecciones 301, sitemap y Search Console; nunca garantiza preservar todo el tráfico.
