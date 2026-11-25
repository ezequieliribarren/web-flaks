# Plan de contenido orgánico y medición

Objetivo: que el sitio reciba **consultas orgánicas** (de Google y de buscadores de IA) y poder **demostrar con datos** cuántas llegan y de qué guía vienen.

Última actualización: 25/11/2026.

> **Precios:** las guías de costos mencionan valores "desde" en un solo párrafo (landing, sitio corporativo, tienda y ecommerce, en pesos de noviembre de 2026). Revisarlos cada pocos meses y actualizar `updated`. El servicio de redes se cotiza sin publicar precios.

> **llms.txt:** `/llms.txt` resume el sitio y lista las guías para asistentes de IA; se genera solo desde `data/blog`.

---

## 1. Qué se construyó

- **Blog en `/blog`** y una guía por URL en `/blog/<slug>`. Cada guía es un archivo en `data/blog/<slug>.json`; no hace falta tocar código para publicar una nueva.
- **Cada guía incluye** (pensado para Google y para buscadores de IA): una *respuesta rápida* al principio, índice, secciones con encabezados claros, tablas, preguntas frecuentes, fuentes citadas, fecha de actualización visible y enlaces a servicios y a otras guías.
- **Schema** en cada guía: `BlogPosting`, `FAQPage` y `BreadcrumbList`. El índice tiene `Blog`.
- **Sitemap**: `/blog` y cada guía entran solas, con su fecha de actualización real.
- **Enlazado interno**: cada página de servicio muestra "Guías relacionadas"; el pie del sitio enlaza al blog; las guías enlazan a servicios y entre sí.
- **Medición**: cada botón de WhatsApp de una guía lleva su origen (`data-wa="blog-<slug>-mid"` / `-end"`), y el sitio emite `article_progress` (25/50/75/100 %) con el `article_slug`.

### Cómo publicar una guía nueva
1. Copiar un JSON de `data/blog/` y cambiar `slug`, `service`, `title`, `metaTitle`, `metaDescription`, `answer`, `sections`, `faq`, `sources`.
2. `service` es uno de: `landing-page`, `sitio-web`, `tienda-digital`, `redes-sociales`, `pauta-publicitaria`.
3. Poner `"published": false` para dejarla como borrador (se ve solo en local, con `noindex`, y no sale en el sitemap).
4. Correr `node scripts/qa/e2e.mjs`: valida schema, canonical, enlaces rotos, CTAs y medición.
5. Actualizar `"updated"` cada vez que se revise el contenido.

---

## 2. Guías publicadas (12)

| Guía | Servicio | Búsqueda que apunta a captar |
|---|---|---|
| Cuánto cuesta una página web en Argentina | Sitio web | cuánto cuesta una página web (precios "desde" al pasar, en un párrafo) |
| Cuánto cuesta un community manager o agencia de redes | Redes sociales | cuánto cobra un community manager (sin precios) |
| Qué es una landing page y para qué sirve | Landing page | qué es una landing page |
| Cómo vender por WhatsApp con tu sitio web | Sitio web | vender por whatsapp, botón de whatsapp |
| Checklist antes de lanzar Google Ads | Pauta | checklist google ads |
| Landing page o solo Instagram para vender | Landing page | landing page o instagram |
| Landing page para Google Ads: cómo armarla para que convierta | Landing page | landing page para google ads, landing que convierte |
| Landing page o sitio web: cuál necesita tu negocio | Sitio web | landing page o sitio web, diferencia |
| Tienda Nube o WooCommerce: cuál elegir en Argentina | Tienda online | tienda nube o woocommerce |
| Cómo elegir una agencia de redes sociales: 8 preguntas | Redes sociales | agencia de redes sociales, contratar community manager |
| Google Ads para pymes: cómo empezar sin tirar plata | Pauta | google ads para pymes, cuánto invertir |
| SEO básico para tu sitio web: checklist de 12 puntos | Sitio web | seo básico, cómo aparecer en google |

## 3. Próximas guías (en orden de prioridad)

Las que **necesitan datos reales de FLAKS** no se publican hasta tenerlos: un precio inventado le resta confianza al sitio y a las respuestas de IA.

| # | Guía | Necesita de FLAKS |
|---|---|---|
| 1 | **Cuánto cuesta una página web en Argentina** | Rangos reales de precio por servicio (o "desde") y qué cambia el valor. Es la búsqueda con más intención de compra. Las agencias casi no publican precios: es una ventaja. |
| 2 | **Cuánto cobra un community manager o una agencia de redes** | Precios (o rangos) de los planes Presencia, Profesional y Total. |
| 3 | **Cuánto cuesta una tienda online en Argentina** | Rangos reales y costos externos (plataforma, pasarela). |
| 4 | Landing page vs Instagram/Linktree para vender | Nada: se puede escribir ya. |
| 5 | Qué es una landing page y para qué sirve | Nada. |
| 6 | Cómo vender por WhatsApp con tu sitio web | Nada. |
| 7 | Checklist antes de lanzar campañas de Google Ads | Nada. |
| 8 | **Caso de éxito**: una por proyecto (problema, solución, resultado) | Autorización del cliente y un dato de resultado real por caso. |
| 9 | Mercado Libre Ads: cuándo conviene y cómo medirlo | Nada, pero conviene tu experiencia propia. |
| 10 | Páginas locales: *diseño de páginas web en [barrio/zona]* | Solo si atendés presencial en esas zonas. |

> Cada vez que haya un dato real nuevo (precio, resultado de un cliente, plazo), conviene actualizar las guías existentes y la fecha `updated`: Google y los buscadores de IA priorizan contenido vigente.

---

## 4. Cuánta gente busca cada tema (validar la demanda)

No hay un número confiable sin la herramienta de Google. Hacelo así, es gratis con tu cuenta de Google Ads:

1. Google Ads → **Herramientas → Planificador de palabras clave → Descubrir palabras clave**.
2. Elegí **Argentina** e idioma **español**.
3. Pegá las búsquedas objetivo de la tabla de arriba y de la sección 3.
4. Anotá el **volumen mensual aproximado** y el **rango de puja** (indica cuánto vale una consulta).

**Cómo decidir con ese dato:** priorizá guías con volumen razonable y baja competencia. Un tema con pocas búsquedas pero intención de compra alta (ej.: *precio de una landing page*) vale más que uno con mucho volumen y curiosidad.

Después de publicar, el dato real de demanda lo da **Search Console** (sección 5): cuántas veces apareció cada búsqueda.

---

## 5. Cómo medir (lo que hay que dejar configurado)

### Antes de publicar: línea de base
Exportá y guardá **hoy** estos datos, para poder comparar en 30/60/90 días:
- Search Console → Rendimiento → últimos 28 días → exportar (clics, impresiones, consultas, páginas).
- GA4 → Informes → Adquisición → Adquisición de tráfico → canal **Organic Search**: sesiones y eventos clave.

### Search Console (demanda y posicionamiento)
- Verificá `flaks.com.ar` como propiedad y **enviá `https://flaks.com.ar/sitemap.xml`**.
- Pedí la indexación de `/blog` y de cada guía (Inspección de URLs → Solicitar indexación).
- **Dónde mirar:** Rendimiento → filtro Página → *contiene* `/blog/`.
  - **Impresiones** = cuántas veces apareció la guía (es la medida de "cuánta gente busca de esa forma").
  - **Consultas** = qué escribió la gente. Es oro para elegir las próximas guías.
  - **Posición** y **CTR** = si hay que mejorar el título o la descripción.

### GA4 (consultas reales)
1. **Importá en GTM** `gtm/flaks-blog-import.json` (Administrador → Importar contenedor → Fusionar → *Cambiar el nombre de elementos en conflicto*). Suma el evento `article_progress` con `percent`, `article_slug` y `article_service`. Probalo en Vista previa y publicá.
2. Marcá como **eventos clave** solo `contacto_whatsapp` y `contacto_formulario` (ya configurados).
3. Registrá estas **dimensiones personalizadas** (Administrar → Definiciones personalizadas → alcance *Evento*): `article_slug`, `article_service`, `click_location` y `percent`.
4. Armá **una exploración** (Explorar → Exploración libre):
   - Filas: *Página de destino + cadena de consulta*, filtrada por `/blog/`.
   - Columnas: *Grupo de canales predeterminado de la sesión*.
   - Valores: Sesiones, Eventos clave, `contacto_whatsapp`, `contacto_formulario`.
   - Segmento: Organic Search.

   Resultado: **cuántas consultas trajo cada guía desde Google**.
5. El valor `click_location` de cada WhatsApp indica la guía y el punto del clic (`blog-<slug>-mid` o `-end`), útil para saber si convierte mejor el botón del medio o del final.

### Qué número mirar y cuándo
| Plazo | Qué mirar | Señal sana |
|---|---|---|
| Semanas 1-4 | Páginas indexadas, impresiones | Las guías aparecen en Search Console |
| Meses 2-3 | Impresiones y posición promedio | Impresiones creciendo semana a semana |
| Meses 3-6 | Clics orgánicos al blog y consultas por guía | Primeras consultas atribuidas a una guía |
| Siempre | Consultas orgánicas / mes (WhatsApp + formulario) | Tendencia ascendente |

El SEO es un trabajo de **meses**: el primer resultado visible es el de impresiones, no el de consultas. No juzgues por la primera semana.

### Buscadores de IA (ChatGPT, Perplexity, Gemini, Copilot)
- **Visitas desde IA:** en GA4 → Adquisición → *Fuente/medio* y buscá `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`. Registrá cuántas sesiones y consultas traen.
- **Prueba manual mensual:** hacé las preguntas objetivo ("agencia de diseño web en Buenos Aires", "Tienda Nube o WooCommerce") en 3 asistentes y anotá si aparece FLAKS o alguna guía. Guardalo en una planilla con la fecha.
- Lo que más ayuda a aparecer en respuestas de IA: respuestas directas al comienzo, datos reales y vigentes, schema, fuentes citadas, y **menciones en sitios de terceros** (ver sección 6).

---

## 6. Autoridad: lo que no se resuelve con código

Google y los asistentes de IA confían en lo que otros dicen de vos.

1. **Crédito en los sitios que ya hicieron.** Son 16 proyectos. Agregar "Sitio por FLAKS" con enlace a `flaks.com.ar` en el pie de cada uno da enlaces reales y baratos. Es lo más rentable a corto plazo.
2. **Ficha de Google Business** completa, con servicios, fotos y reseñas reales (pedirlas con el enlace directo a 8-10 clientes).
3. **Directorios de agencias** (Clutch, DesignRush y similares): perfil completo con los mismos datos de contacto que el sitio.
4. **Mismos datos en todos lados** (nombre, teléfono, ciudad), para que Google asocie todo con la misma marca.
5. **Perfiles de marca** en `sameAs` del schema (Instagram ya está; sumar Google Business y LinkedIn cuando existan).

---

## 7. Ritmo de trabajo sugerido
- **1 guía nueva por semana** (o cada 2) durante los primeros 3 meses. La constancia pesa más que el volumen.
- **Mensual:** revisar Search Console (consultas nuevas → próxima guía), actualizar 1 guía con datos nuevos y completar la prueba de IA.
- **Trimestral:** comparar contra la línea de base y decidir qué guías reforzar o unificar.
