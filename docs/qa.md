# QA: registro de revisiones

Revisiones hechas durante la construcción del sitio (septiembre de 2026). No había disponible el plugin `design`, así que cada pasada se hizo a mano como checklist, con apoyo de scripts en `scripts/qa/`.

Cómo repetirlas (con el servidor corriendo en `localhost:3000`):

```bash
node scripts/qa/e2e.mjs      # formularios, dataLayer, redirects, anclas, carril con teclado, móvil
node scripts/qa/a11y.mjs     # headings, alt, ids, áreas táctiles, contraste real
node scripts/qa/lh.mjs / /landing-page /sitio-web /tienda-digital   # Lighthouse móvil
```

---

## 1. UX copy

**Criterio:** cada CTA dice la acción y el beneficio, sin ambigüedad, en voseo.

| Dónde | Antes / riesgo | Resultado |
|---|---|---|
| Botón de formularios | "Enviar consulta" (genérico) | **"Pedir presupuesto"**, igual que la barra fija móvil. |
| Estado de envío | — | "Enviando…" y el botón queda deshabilitado (`aria-busy`). |
| Éxito | — | "¡Listo! Recibimos tu consulta." + "Te escribimos en el día hábil" + botón "Hablar por WhatsApp". |
| Errores | — | Específicos por campo: "Contanos tu nombre.", "Dejanos un teléfono con código de área, por ejemplo 11 5745 5803.", "Revisá el email: parece incompleto." Errores de red: ofrecen WhatsApp como salida. |
| Placeholders | — | Ejemplos concretos por página ("Ej.: ropa deportiva, unos 80 productos"). Campos opcionales marcados como "(opcional)". |
| Acordeones | "Ver más" | "Ver planes y detalles" / "Ocultar planes y detalles". |
| Planes de redes | — | "Consultar plan Presencia / Profesional / Total", cada uno con un mensaje de WhatsApp precargado. |
| Links a proyectos | "Entrá y miralá" solo | Se agregó texto para lector de pantalla: ": sitio de X (abre en una pestaña nueva)". |
| Enlazado interno | — | Anclas descriptivas ("sitios web completos", "tiendas online con Mercado Pago", "Landing page, lista en 5 días"). Nunca "click acá". |
| WhatsApp | — | Mensaje precargado según el contexto (servicio, plan, página). |

## 2. Crítica de diseño

**Criterio:** jerarquía visual, consistencia entre las 3 páginas de servicio y un CTA principal visible en todo momento.

- **Consistencia:** las 3 páginas salen de una sola plantilla (`views/service.ejs`), con los mismos componentes y el mismo orden: hero → beneficios → para quién → qué incluye → portfolio → proceso → FAQ → otros servicios → contacto.
- **CTA siempre visible:**
  - En desktop, el header de las páginas de servicio **queda fijo**, con "Contactar" y "Agendar llamada". Antes se ocultaba al bajar.
  - En móvil, una barra fija con "WhatsApp" y "Pedir presupuesto" aparece al salir del hero y se oculta al llegar al formulario.
  - En la home, el botón flotante de WhatsApp está siempre visible.
- **Jerarquía:** un solo titular dominante por sección y el verde reservado para palabras clave, números y acciones. Los números gigantes de servicios son solo contorno, para no competir con el título.
- **Ajustes hechos durante la revisión visual:**
  - Descendentes del H1 cortados.
  - Hero más alto que la pantalla en 1440×900.
  - "¿Empezamos?" partido con guion.
  - Pasos del proceso desalineados.
  - Línea del proceso pisando el texto en móvil.
  - Palabra rotativa del H1 invadiendo la imagen en 1024 px.
  - Carril sin alinear con el contenedor.
- **Anchos revisados:** 360, 390, 768, 1024, 1440 y 1920 px.

## 3. Accesibilidad (WCAG 2.1 AA)

| Punto | Estado |
|---|---|
| Contraste de texto (todas las combinaciones reales) | ✓ El mínimo es el placeholder: 5,53:1. El texto secundario sobre la tarjeta da 8,5:1, el verde sobre el fondo 13,7:1 y el texto oscuro sobre el botón verde 14,4:1. |
| Contraste no textual (1.4.11) | ✓ Borde de los campos: subido a 3,52:1, antes daba menos de 3:1. Anillo de foco verde: 13,7:1. |
| Foco visible | ✓ Contorno verde de 3 px en todos los controles. El header reaparece al recibir foco. |
| Áreas táctiles ≥ 44×44 | ✓ Botones, links de navegación, footer, FAQ, migas, flechas del portfolio y botón de menú. Se corrigieron "Inicio" en las migas y el link dentro del título de cruce. |
| Teclado en el carril de proyectos | ✓ El carril es una región enfocable. Las flechas ← → avanzan y **Tab sobre una tarjeta la trae a la vista**: el script mueve el scroll vertical al punto justo. Está probado en e2e. |
| Lector de pantalla en el carril | ✓ `role="region"` con etiqueta y contador `03 / 15` con `aria-live="polite"`. Solo se anuncia cuando cambia el proyecto, no en cada frame. |
| Acordeones de Redes / Pauta | ✓ `<button aria-expanded aria-controls>` y región etiquetada. Se abren también por URL (`/#redes-sociales`). |
| FAQ | ✓ Con `<details>/<summary>` nativos. |
| Menú móvil | ✓ `aria-expanded`, Escape para cerrar y **foco atrapado** dentro del menú (se agregó en la revisión). |
| `alt` de imágenes | ✓ Descriptivos y únicos, por ejemplo "Tienda online de Lusqtoff Tigre, catálogo de herramientas eléctricas segmentado por rubro". Se corrigió un duplicado entre el hero y el portfolio. |
| Estructura | ✓ Un solo `h1` por página y jerarquía sin saltos (verificado en las 6 páginas). `lang="es-AR"` y link para saltar al contenido. |
| Formularios | ✓ `label` en cada campo, errores con `aria-describedby` y `aria-invalid`, estado con `role="alert"`, foco al mensaje de éxito y `autocomplete`. |
| Movimiento | ✓ Con `prefers-reduced-motion` no hay preloader, pines ni parallax. El carril pasa a scroll nativo con snap y las cintas se detienen. |
| Lighthouse Accesibilidad | 100 en las 5 páginas. |

## 4. Performance / Core Web Vitals (Lighthouse móvil, local, sin GTM)

| Página | Performance | LCP | CLS | TBT |
|---|---|---|---|---|
| `/` | 98 | 2,0 s | 0 | 80 ms |
| `/landing-page` | 93 | 1,7 s | 0 | 290 ms |
| `/sitio-web` | 97 | 1,7 s | 0 | 160 ms |
| `/tienda-digital` | 97 | 1,7 s | 0 | 180 ms |
| `/privacidad` | 99 | 1,4 s | 0 | 140 ms |

SEO 100 y Buenas prácticas 100 en todas.

**Hallazgos corregidos:**

- **`filter: blur()` sobre los glows de fondo.** Costaban unos 2 s de render en móvil, con TBT de 1,85 s y la home en 70. Se reemplazaron por gradientes radiales, que dan el mismo efecto sin costo.
- **Layout forzado en `service.js`.** Se difiere con `requestIdleCallback`.
- **`content-visibility: auto`** en las secciones debajo del pliegue de las páginas de servicio. En la home no se usa porque interfiere con ScrollTrigger.
- **`text-wrap: pretty` global.** Quedó solo en los párrafos destacados.
- **Caché de la fuente.** Ahora es de 1 año.

> Con GTM activo en producción, estos números bajan un poco: depende de cuántas etiquetas tenga el contenedor. Conviene medir de nuevo en `nuevo.flaks.com.ar` antes de migrar.

---

## Ronda 2 (29/09/2026): cambios pedidos tras la primera revisión

| Pedido | Cómo quedó |
|---|---|
| Manifiesto: "todo pensado para escalar tu marca" | Aplicado. |
| Carril lateral más corto | Un proyecto por capítulo (3 tarjetas), contador `01 / 03`. |
| "Todos los proyectos" agrupado y sutil | Grupos Tiendas digitales / Landing pages / Sitios multipágina: 3 visibles + "Ver los N restantes" (botón con `aria-expanded`). En móvil cada fila tiene miniatura. |
| Títulos h1/h2 2 px más chicos | `calc(… - 2px)` en h1 de home y servicios y en `--fs-2xl` (h2). |
| Reseñas con captura, lentas | Cinta de reseñas (140 s por vuelta, se pausa con hover/foco; con movimiento reducido pasa a scroll horizontal). Datos en `data/reviews.json`; en producción solo se publican las `verified: true`. |
| "Así trabajamos, sin vueltas" | Ahora "Así trabajamos, paso a paso." |
| Logos oficiales | Versiones transparentes generadas con `scripts/brand.mjs`; wordmark en header/footer, ícono en preloader, favicon y OG. |
| Wordmark gigante del footer | Eliminado. |
| Panel de servicio "pegado al piso" (1836×786) | El pin solo se activa si el panel entra entero en la pantalla; tipografía y espaciados del panel escalan con la altura (`vh`). |
| Contenido oculto de Redes/Pauta | Sin acordeones. Los paneles tienen el botón "Ver detalle del servicio" (aparece al scrollear) que lleva a las nuevas `/redes-sociales` y `/pauta-publicitaria`. El footer también enlaza ahí. |
| Portfolio de las páginas de servicio | Lista estilo "Todos los proyectos" con preview flotante (desktop) y miniaturas (móvil), en lugar del slider. |

**Verificación:** e2e 46/46 · auditoría a11y sin hallazgos en 8 páginas · 360 px sin desborde horizontal en las 6 páginas principales · Lighthouse móvil: home 88–94 (varía entre corridas; la cinta de reseñas suma imágenes), `/landing-page` 95, `/redes-sociales` 90, `/pauta-publicitaria` 92, accesibilidad 100 en todas.

**Hallazgos corregidos en la ronda:**
- Las palabras del manifiesto antes de iluminarse (16 % de opacidad) no cumplían contraste: ahora arrancan en 45 % (≥ 3:1, texto grande).
- Estrellas de reseñas con `role="img"`.
- `alt` del logo vacío (el link ya tiene nombre).
- Link del footer de servicio con área táctil chica.

## Ronda 3 (29/09/2026)

- Los 3 proyectos destacados del carril ya no se repiten en la lista de abajo.
- La lista se titula "Ya se digitalizaron con nosotros." y cada grupo tiene un botón "Ver más" que despliega el resto.
- En el carril se quitaron el contador "N proyectos" de cada capítulo y el panel final "Ver todos los proyectos". El capítulo "Sitios multipágina" pasó a llamarse "Sitios".
- Los paneles de servicio ya no tienen botones propios. Cada servicio muestra una **solapa lateral fija** (verde, con brillo pulsante), "¿Te interesa este servicio?":
  - Desarrollo Web tiene 3 links: Landing page, Sitio web y Tienda online.
  - Redes y Pauta tienen "Ver más".
  - La solapa aparece con su panel y se va antes de que asome el servicio siguiente.
  - En móvil se usa una franja a media altura, porque los paneles no se pinnean.
  - Se calcula después de los pines de arriba (`refreshPriority: -1`).
- **Verificación:** e2e OK (sumadas las pruebas de solapas y de la lista sin duplicados) y a11y sin hallazgos.

## Ronda 4 (30/09/2026): landing de Redes Sociales

- Planes actualizados:
  - Presencia: 3 + 3 + 15, con "Campañas publicitarias" tachado y en gris (lectores de pantalla oyen "no incluido").
  - Profesional: suma programación de contenido, Facebook + Instagram y hasta 3 campañas en Meta.
  - Total: 6 + 6 + 25 y campañas ilimitadas.
- Botón verde "¿Necesitás algo a medida?" que lleva a WhatsApp, debajo de los planes.
- FAQ: "¿Tengo que publicar el contenido?" y "¿Tengo que brindar acceso a mi cuenta?". El JSON-LD FAQPage se actualiza solo.
- "¿Querés sumar alcance pago?" reemplazado por **"Estas marcas ya no piensan qué publicar. Lo pensamos nosotros."**:
  - Muestra los feeds reales de @sistemacontinuo, @artanium.ar, @senko.ar y @tentaciones.ropa, capturados con `scripts/capture-social.mjs`.
  - En desktop es una grilla; en móvil, un carril con snap.
- Popup "10% OFF en todos los planes":
  - No es modal: no bloquea la página ni roba el foco.
  - Aparece una vez por sesión al llegar a los planes y se cierra con la X o con Escape.
  - En móvil se muestra compacto, encima de la barra fija.
- **Verificación:**
  - e2e OK (pruebas nuevas de planes, popup y redes gestionadas).
  - a11y sin hallazgos.
  - Lighthouse `/redes-sociales`: 94 / 100 / 100 / 100.

## Ronda 6 (30/09/2026)

- **Headers de las 5 landings:** sin la línea de plazos ni la de "Hosting, dominio y SSL".
- **Hero de landing, sitio y tienda:** la captura rota entre los proyectos del portfolio.
  - Fundido cada 3,5 s, con una capa violeta FLAKS (multiply).
  - Con el mouse o el foco encima, la rotación se detiene y la captura se ve a color.
  - Con movimiento reducido no rota.
  - Las capturas 2 en adelante se piden con el navegador libre, 1,5 s después de la carga. Si se cargan todas juntas, el LCP simulado de Lighthouse subía a 4 s. El real, medido con CPU ×4, seguía en 1,4 s.
- **Descuentos:** landing 5 %, sitio 5 % y tienda 10 %. El popup aparece al llegar a "¿Es para vos?". En Redes sigue apareciendo en los planes.
- **Redes:**
  - "¿Necesitás algo a medida?" ahora es una oración con link.
  - Feeds recortados en la 3.ª fila, con celular más chico (250 px) y capa violeta oscura que se va con el hover.
- **Formularios:** Sitio "Estás a un paso de escalar tu marca." · Tienda "Empezá a vender tus productos."
- **Tienda:** 7 días hábiles. FAQ: WordPress a medida, y cobros con Mercado Pago, Pago Nube y transferencia.
- **Verificación:**
  - e2e OK (con prueba de los 3 descuentos).
  - a11y sin hallazgos.
  - Lighthouse: landing 92, sitio 90, tienda 95, accesibilidad 100.

## Ronda 7 (30/09/2026)

- **VSL:** el video original (48 MB, 1080p a 10 Mbps) se comprimió con ffmpeg:
  - Principal de 720p (3,7 MB, arranca sin esperar la descarga completa).
  - Adelanto de 5 s sin sonido (67 KB).
  - Portada WebP (31 KB).
- **Disparador:** tarjeta inclinada que asoma desde la derecha.
  - En desktop va fija a media altura. En móvil va dentro del hero, junto a los botones, sin superposiciones (verificado en 360, 375, 390 y 412 px).
  - Solo se ve en el hero: al scrollear se va.
  - El adelanto arranca 3 s después de la carga. Si arrancaba antes, el TBT de la home subía de 230 a 600 ms.
- **Inicio:** sin "Te acompañamos a escalar tu marca." Reseñas ocultas con `showReviews: false`; el código se mantiene.
- **Verificación:**
  - e2e OK y a11y sin hallazgos.
  - Lighthouse home: 90–92.
