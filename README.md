# FLAKS · flaks.com.ar

Sitio de FLAKS, agencia digital de Buenos Aires. Está hecho con **Node.js + Express + EJS**, se renderiza en el servidor y no usa base de datos. El contenido vive en archivos JSON. Las animaciones usan **GSAP + ScrollTrigger + Lenis**, sin bundler: los archivos JS y CSS se sirven tal cual desde `public/`.

## Contenido

- [Estructura](#estructura)
- [1. Correr en local](#1-correr-en-local)
- [Editar contenido](#editar-contenido)
- [2. Regenerar capturas e imágenes OG](#2-regenerar-capturas-e-imágenes-og)
- [3. Subir a GitHub](#3-subir-a-github)
- [4. Crear la app Node.js en Hostinger (hPanel)](#4-crear-la-app-nodejs-en-hostinger-hpanel)
- [5. Conectar flaks.com.ar y activar SSL](#5-conectar-flakscomar-y-activar-ssl)
- [6. Plan de migración sin caída](#6-plan-de-migración-sin-caída)
- [7. Checklist post-deploy (para no perder tráfico pago)](#7-checklist-post-deploy-para-no-perder-tráfico-pago)
- [QA](#qa)

---

## Estructura

```
server.js              Express: host canónico, redirects, seguridad (CSP), estáticos, rutas
lib/content.js         Carga y prepara los JSON (numeración, plazos, capítulos)
lib/seo.js             Datos estructurados JSON-LD
routes/                pages · contact (POST /api/contacto) · redirects · sitemap/robots · host
views/                 layout + partials + home, service (plantilla de las 3 páginas), privacidad, 404
data/                  projects.json · services.json · faq.json · redirects.json · site.json
public/                css/ · js/ · fonts/ · vendor/ (GSAP, Lenis) · img/{brand,projects,og}
scripts/               capture.mjs (capturas) · og.mjs (imágenes OG e íconos) · vendor.js · qa/
docs/qa.md             Registro de revisiones (UX copy, diseño, accesibilidad, performance)
```

**Rutas:**

| Ruta | Qué es |
|---|---|
| `/` | Home |
| `/landing-page` · `/sitio-web` · `/tienda-digital` | Páginas con tráfico pago. Responden igual con o sin barra final. |
| `/redes-sociales` · `/pauta-publicitaria` | Páginas de servicio (misma plantilla, con planes / plataformas en lugar de portfolio). |
| `/privacidad` | Política de privacidad |
| `/sitemap.xml` · `/robots.txt` | Generados por Express |
| `/desarrollo-web` | **301** a `/#servicios`. Conserva los parámetros UTM/gclid. |

---

## 1. Correr en local

Requisitos: Node.js 20 o superior.

```bash
cp .env.example .env      # completá los valores (ver abajo)
npm install               # también copia GSAP y Lenis a public/vendor (postinstall)
npm start                 # http://localhost:3000
```

Para desarrollo, `npm run dev` reinicia el servidor al cambiar `server.js`, `routes/`, `lib/` o `data/`.

**Variables de entorno (`.env`):**

| Variable | Para qué |
|---|---|
| `PORT` | Puerto. Hostinger lo define solo. |
| `NODE_ENV` | `production` en el servidor. |
| `SITE_URL` | `https://flaks.com.ar`. Se usa en canonical, sitemap, OG y JSON-LD. |
| `CANONICAL_HOST` | `apex` redirige `www` → `flaks.com.ar`, `www` hace lo contrario y vacío no redirige. |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` | Correo del formulario. En Hostinger: `smtp.hostinger.com`, puerto `465`. |
| `MAIL_TO` `MAIL_FROM` | Destino y remitente de los avisos de consulta. |
| `WHATSAPP_NUMBER` | `5491157455803`. Se usa en todos los botones. |
| `GTM_ID` | `GTM-TWHGP8NC`. **Dejalo vacío en local** para no ensuciar las métricas reales. |
| `BOOKING_URL` | Destino de "Agendar llamada". Si está vacío, abre WhatsApp. |

> Sin SMTP configurado, el formulario responde OK y muestra la consulta en la consola del servidor. Sirve para probar en local.

## Editar contenido

Todo el contenido se edita en `data/`, sin tocar código:

- **Proyectos (`data/projects.json`):**
  - Para sumar uno, agregá un objeto con el mismo esquema y corré `npm run capture -- <slug>`.
  - El carril de la home muestra **un proyecto por capítulo**: el primero con `featured: true`. Para cambiarlo, reordená el JSON o movés el `featured`.
  - La lista "Todos los proyectos" los agrupa por capítulo y muestra 3 por grupo, con "Ver los N restantes".
  - `pages` define en qué páginas de servicio aparece: `landing-page`, `sitio-web` y/o `tienda-digital`.
  - `enabled: false` lo oculta en todo el sitio.
- **Servicios (`data/services.json`):** textos de las 5 páginas de servicio y de los paneles de la home. Los plazos (`delivery`) se definen **una sola vez** por servicio y se reutilizan en el FAQ.
- **Preguntas frecuentes (`data/faq.json`):** `{plazo}` se reemplaza por el plazo del servicio.
- **Redirects (`data/redirects.json`):** origen → destino. Se aplican con 301 y se agregan también a `robots.txt`.
- **Redes que gestionamos (`data/social.json`):** cuentas de Instagram que se muestran en `/redes-sociales`. Para actualizar las capturas del feed: `npm run capture:social`. Instagram muestra el perfil sin iniciar sesión; si algún día lo bloquea, el script avisa y se conservan las capturas anteriores.
- **Popup de descuento de Redes:** se configura en `services.json` → `pages.redes-sociales.promo` (texto, porcentaje, mensaje de WhatsApp). Borrá `promo` para apagarlo. Aparece una vez por sesión al llegar a los planes y registra `promo_view` / `promo_click` en el dataLayer.
- **Planes:** un ítem `{ "text": "…", "excluded": true }` se muestra tachado y en gris (no incluido).
- **Reseñas (`data/reviews.json`):** texto, autor, rubro, estrellas y el `slug` del proyecto (para mostrar su captura).
  - **Solo se publican en producción las que tienen `"verified": true`**: textos reales, aprobados por el cliente o tomados de Google. Las de ejemplo se ven únicamente en local, con la etiqueta "Ejemplo".
  - Si no hay ninguna verificada, la sección no aparece.
- **Logo:** los originales (`LOGO.png` y `logo_flaks.png`, con fondo violeta) están en `public/img/brand/`.
  - `node scripts/brand.mjs` genera las versiones con fondo transparente: `logo-icon.png` y `logo-wordmark.png`.
  - Después corré `npm run og` para regenerar el favicon y las imágenes OG.

## Medición (GTM, GA4, Google Ads, Clarity)

- **Google Tag Manager `GTM-TWHGP8NC`:** es el mismo contenedor que usa el sitio actual.
  - Incluye la etiqueta de Google `G-95RC8ETL8Z` (GA4), vinculada a Google Ads `11529261276` para remarketing.
  - Incluye 19 eventos de GA4 que se disparan por **clases CSS**. El sitio nuevo conserva exactamente esas clases:

| Clase | Elemento |
|---|---|
| `gtm-wa-flotante` | WhatsApp flotante (todas las páginas) |
| `gtm-calendly-{lp,sw,td}` | "Agendar llamada" (header y menú móvil) |
| `gtm-wa-hero-{…}` | WhatsApp del hero |
| `gtm-wa-planes-{…}` | WhatsApp de "Qué incluye" (`#que-incluye`) |
| `gtm-wa-portfolio-{…}` | "Crear mi landing / sitio / tienda" (portfolio) |
| `gtm-wa-cta-{…}` | WhatsApp de la sección de contacto y de la barra fija móvil |
| `gtm-form-{…}` · `gtm-submit-{…}` | Formulario y su botón |

  - **Sufijos:** `lp` = /landing-page, `sw` = /sitio-web, `td` = /tienda-digital. Redes y Pauta usan `rs` y `pp`, que todavía no tienen tags en GTM.
  - **Formulario:** los envíos inválidos **no** llegan a GTM; solo cuenta el envío válido, que además empuja `generate_lead` al dataLayer.
- **Sin `gtag.js` a mano:** no se agrega. El sitio viejo lo tenía además de GTM y duplicaba las páginas vistas en GA4.
- **Microsoft Clarity:** opcional, con `CLARITY_ID` en el `.env`.

## Video "Mirá cómo trabajamos" (VSL)

- **Configuración:** en `data/site.json` → `vsl` (`mp4`, `poster`, `preview`). También acepta `youtubeId` o `vimeoId`.
- **Comportamiento:** una tarjeta inclinada asoma desde la derecha solo mientras se ve el hero, con un adelanto sin sonido en loop que arranca 3 s después de la carga. Al tocarla, el video completo entra de derecha a izquierda en desktop y de abajo hacia arriba en móvil.
- **Archivos:** el original (`public/img/video/vsl.mp4`, 48 MB) está en `.gitignore`. El sitio usa `vsl-720.mp4` (3,7 MB), `vsl-preview.mp4` (67 KB) y `vsl-poster.webp`.
- **Regenerar los archivos con ffmpeg:**
  ```bash
  ffmpeg -i vsl.mp4 -vf scale=-2:720 -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k vsl-720.mp4
  ffmpeg -ss 0 -t 5 -i vsl.mp4 -an -vf "scale=480:-2,fps=24" -c:v libx264 -crf 30 -pix_fmt yuv420p -movflags +faststart vsl-preview.mp4
  ```
- **Reseñas:** se muestran solo con `showReviews: true` en `data/site.json` (hoy están ocultas; el código queda listo).

## 2. Regenerar capturas e imágenes OG

Estos scripts se corren a mano, **nunca en el deploy**. Las imágenes que generan se commitean.

```bash
npx playwright install chromium   # una sola vez
npm run capture                    # todas las capturas → public/img/projects/*.webp
npm run capture -- winman melesia  # solo algunos proyectos
npm run og                         # imágenes OG 1200×630 + favicon + apple-touch-icon
```

`capture.mjs` hace esto con cada proyecto:

1. Abre el sitio en 1440×900.
2. Cierra o esconde los banners de cookies, popups y chats.
3. Guarda la portada (`-hero`) y una segunda vista 900 px más abajo (`-alt`), en WebP de 1440 y 800 px.
4. Si un sitio falla, genera un placeholder de marca y sigue con el siguiente.

## 3. Subir a GitHub

```bash
git add .
git commit -m "Sitio nuevo de FLAKS"
git branch -M main
git remote add origin git@github.com:<usuario>/flaks-web.git
git push -u origin main
```

`.env` y `node_modules/` están en `.gitignore`. `public/vendor/` **se commitea**, así el deploy no depende de que el `postinstall` corra bien.

## 4. Crear la app Node.js en Hostinger (hPanel)

1. En hPanel, entrá a **Sitios web → (tu sitio) → Avanzado → Node.js** ("Setup Node.js App").
2. Creá la app con estos datos:
   - **Versión de Node:** 20 o 22.
   - **Modo:** Production.
   - **Carpeta raíz de la app:** la carpeta donde queda el repo (por ejemplo `nodeapps/flaks`).
   - **URL de la app:** primero el subdominio de prueba (ver el punto 6).
   - **Archivo de inicio:** `server.js`.
3. Conectá el repo en **Importar desde GitHub** (o Git → Deploy), rama `main`, y activá el redeploy automático al hacer push.
4. Cargá las **variables de entorno** de la tabla de arriba:
   - `NODE_ENV=production`
   - `SITE_URL=https://flaks.com.ar`
   - `CANONICAL_HOST=apex`
   - SMTP real
   - `GTM_ID=GTM-TWHGP8NC`
   - Etcétera.
5. Tocá **NPM Install** y después **Restart**.
6. Probá `https://<url-de-la-app>/` y `/sitemap.xml`.

> Hostinger define `PORT` y el servidor lo lee de `process.env.PORT`. No hace falta configurarlo.

## 5. Conectar flaks.com.ar y activar SSL

1. En la app Node.js, cambiá la URL de la app a `flaks.com.ar`.
2. Si el dominio está en Hostinger, apuntá los DNS al hosting: registros A de `@` y `www`.
3. En **Seguridad → SSL**, instalá el certificado (Let's Encrypt, gratis) para `flaks.com.ar` y `www.flaks.com.ar`, y activá **Forzar HTTPS**.
4. Con `CANONICAL_HOST=apex`, `www.flaks.com.ar` redirige con 301 a `flaks.com.ar`.

## 6. Plan de migración sin caída

1. **Publicar en un subdominio de prueba**, por ejemplo `nuevo.flaks.com.ar`, con `SITE_URL=https://flaks.com.ar`. Así los canonical ya apuntan al dominio final y Google no indexa el subdominio como sitio aparte.
2. **Validar en el subdominio:**
   - Las 5 rutas reales responden 200, con y sin barra final.
   - Los 3 redirects responden 301 y abren el panel correcto.
   - El formulario de las 4 páginas envía el mail real con la página de origen y los UTM (probá con `?utm_source=test`).
   - GTM: en **Vista previa** de Tag Manager se ven `generate_lead` y `whatsapp_click`, y las etiquetas de conversión de Ads y Meta se disparan.
   - `robots.txt` y `sitemap.xml` usan el dominio final.
   - Lighthouse móvil de las 3 páginas de servicio sigue en 90 o más.
3. **Bajar el TTL de los DNS** a 300 s un día antes del cambio.
4. **Apuntar `flaks.com.ar`** a la app nueva en un horario de bajo tráfico. Dejá el sitio viejo intacto hasta confirmar que todo funciona, para poder volver atrás rápido.
5. **Monitorear 48 h:** conversiones en Google Ads y Meta, errores en Search Console y mails del formulario.

## 7. Checklist post-deploy (para no perder tráfico pago)

- [ ] `https://flaks.com.ar/landing-page`, `/sitio-web` y `/tienda-digital` responden **200** y cargan igual o más rápido que antes. Medí con PageSpeed Insights, móvil.
- [ ] Lo mismo con barra final: `/landing-page/`, `/sitio-web/` y `/tienda-digital/`.
- [ ] `/redes-sociales` y `/pauta-publicitaria` responden **200** con su página propia.
- [ ] `/desarrollo-web` (con y sin `/`) responde **301**, nunca 404:
  - `curl -I https://flaks.com.ar/desarrollo-web`
- [ ] `https://www.flaks.com.ar/...` redirige con 301 a `https://flaks.com.ar/...`.
- [ ] `robots.txt` y `sitemap.xml` OK, con 7 URLs.
- [ ] El evento `generate_lead` llega a GTM desde el formulario de **las 3 páginas de servicio** y la home. Revisalo en Vista previa de Tag Manager y en tiempo real de GA4.
- [ ] Los clics de WhatsApp (`whatsapp_click`) llegan a GTM, si los usás como conversión.
- [ ] Llega el mail de prueba a info@flaks.com.ar, con la página de origen y los UTM.
- [ ] **Search Console:** enviá el sitemap nuevo y revisá que las 3 URLs de servicio aparezcan como "Indexada", sin errores de cobertura.
- [ ] **Google Ads y Meta:** los anuncios siguen aprobados, con la URL final sin cambios, y las conversiones se registran.

## QA

Los scripts internos de revisión están en `scripts/qa/` y requieren el servidor corriendo. Las capturas quedan en `.shots/`, que está ignorado por git.

```bash
node scripts/qa/e2e.mjs        # pruebas de punta a punta
node scripts/qa/a11y.mjs       # accesibilidad y contraste
node scripts/qa/lh.mjs / /landing-page /sitio-web /tienda-digital
node scripts/qa/tour.mjs / --mobile   # capturas recorriendo la página
```

El detalle de lo revisado está en [docs/qa.md](docs/qa.md).
