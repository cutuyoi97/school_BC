# Institución Educativa Rural Buchadó Fernando Botero Angulo

Sitio web institucional de la Institución Educativa Rural Buchadó Fernando Botero
Angulo (contenido de ejemplo/ficticio para fines de este proyecto): identidad
institucional, sedes educativas, personal docente, eventos y centros de
interés, información académica y un formulario de contacto funcional.

## Tecnologías

- HTML5 semántico
- CSS3 (variables de diseño, Grid y Flexbox, sin frameworks)
- JavaScript moderno (ES Modules, sin jQuery ni librerías de carrusel)
- Vercel Serverless Functions (Node.js) para el backend del formulario
- [Resend](https://resend.com) para el envío de correos

## Estructura del proyecto

```
buchado-colegio/
├── index.html              → Página de inicio
├── pages/
│   ├── identidad.html      → Nuestra Identidad (historia, valores, sedes)
│   ├── docentes.html       → Personal Docente (agrupado por nivel/área, filtro por área)
│   ├── eventos.html        → Eventos y Centros de Interés
│   ├── academica.html      → Información Académica e Institucional (PEI, Básica Primaria, calendario, matrícula, SEDUCA)
│   └── contacto.html       → Contacto (formulario, canales, dependencias)
├── assets/
│   ├── images/
│   │   ├── logo/            → Logo y escudo institucional
│   │   ├── institucional/   → Logos de aliados
│   │   ├── sedes/           → Fotografías reales de las tres sedes
│   │   └── comunidad/       → Fotografías reales de estudiantes y actividades
│   └── icons/               → Iconos propios (ícono de teléfono, etc.)
├── css/
│   ├── base.css             → Reset, variables de diseño, tipografía, utilidades
│   ├── components.css       → Navbar, submenús, menú móvil, footer, botones, tarjetas, formularios
│   ├── home.css              → Estilos específicos de inicio
│   ├── identidad.css        → Estilos específicos de Nuestra Identidad y Sedes
│   ├── docentes.css         → Estilos específicos de Personal Docente
│   ├── eventos.css          → Estilos específicos de Eventos y Centros de Interés
│   ├── academica.css        → Estilos específicos de Información Académica
│   └── contacto.css         → Estilos específicos de Contacto
├── js/
│   ├── layout.js             → Header, menú móvil y footer compartidos (fuente única de verdad)
│   ├── navigation.js        → Menú móvil, submenús, header fijo, barra de progreso
│   ├── home.js               → Contadores y animaciones de la página de inicio
│   ├── identidad.js         → Contadores animados y acordeón de valores
│   ├── data/
│   │   └── docentes.js      → Fuente única de datos del personal docente + tarjeta compartida
│   ├── docentes.js          → Agrupación y filtro del personal docente
│   ├── academica.js         → Docentes monodocentes en la sección Básica Primaria
│   ├── events.js            → Contador, filtros y galería con lightbox
│   ├── contact.js           → Validación y envío del formulario de contacto
│   └── utils/
│       ├── countdown.js     → Lógica de cuenta regresiva reutilizable
│       └── reveal.js        → Animación de aparición al hacer scroll
├── api/
│   └── contact.js           → Función serverless: valida y envía el correo con Resend
├── .env.example              → Plantilla de variables de entorno (sin valores reales)
└── package.json
```

Todas las rutas internas (CSS, JS, imágenes) usan rutas absolutas
(`/css/...`, `/js/...`, `/assets/...`) para que funcionen igual sin importar
la profundidad de la página.

### URLs limpias

Las páginas se publican sin `.html` ni `/pages/`, configurado en `vercel.json`:

| URL pública   | Archivo                 |
| ------------- | ----------------------- |
| `/`           | `index.html`            |
| `/identidad`  | `pages/identidad.html`  |
| `/docentes`   | `pages/docentes.html`   |
| `/eventos`    | `pages/eventos.html`    |
| `/academica`  | `pages/academica.html`  |
| `/contacto`   | `pages/contacto.html`   |

- `rewrites` sirve cada URL limpia desde su archivo original (no hay páginas duplicadas).
- `redirects` envía las direcciones antiguas (`/pages/*.html`, `/index.html`) a las nuevas con
  un 301 permanente. `/centros-de-interes` lleva a la sección de Centros de Interés en `/eventos`.
- Los enlaces internos, las etiquetas `canonical`/`og:url`, `sitemap.xml` y `robots.txt` usan
  ya las URLs limpias. Si se agrega una página nueva, hay que sumarla en los tres lugares.
- Para probar estas reglas en local usa `vercel dev` (un servidor estático genérico no las aplica).

El nombre oficial de la institución está centralizado en `js/layout.js`
(constante `INSTITUTION_NAME_FULL`), usado en el
header, el menú móvil y el footer de las seis páginas. Los `<title>` y
metadatos de cada página se mantienen como HTML estático (por SEO) y deben
actualizarse individualmente si el nombre cambia.

## Instalación y ejecución local

Este proyecto es un sitio estático + una función serverless, pensado para
desplegarse en [Vercel](https://vercel.com).

```bash
npm install -g vercel   # si no lo tienes instalado
vercel dev              # sirve el sitio y /api/contact localmente
```

También puedes previsualizar solo el front-end (sin el formulario funcional)
con cualquier servidor estático, por ejemplo:

```bash
npx serve .
```

## Variables de entorno

Copia `.env.example` como `.env.local` y complétalo con tus propios valores.
**Nunca subas un archivo `.env` con valores reales al repositorio** (ya está
excluido en `.gitignore`).

| Variable              | Descripción                                                   |
| ---------------------- | -------------------------------------------------------------- |
| `RESEND_API_KEY`       | API key de tu cuenta de Resend (Dashboard → API Keys).         |
| `CONTACT_TO_EMAIL`     | Correo que recibe los mensajes del formulario.                 |
| `CONTACT_FROM_EMAIL`   | Remitente del correo; debe pertenecer a un dominio verificado en Resend, o usar `onboarding@resend.dev` mientras tanto. |

En producción, configura estas mismas variables en **Vercel → Project
Settings → Environment Variables**.

## Formulario de contacto

Flujo: `formulario (frontend)` → `fetch a /api/contact` → `validación y
honeypot en el servidor` → `Resend` → `correo`.

- La API key de Resend vive únicamente en el backend (`api/contact.js`);
  nunca se expone al navegador.
- El formulario valida en el cliente (mensajes de error por campo) y
  **vuelve a validar en el servidor** (la validación de cliente nunca es
  suficiente por sí sola).
- Incluye un campo honeypot oculto contra bots simples y un límite básico
  de solicitudes por IP (rate limiting best-effort; ver comentario en
  `api/contact.js` sobre sus límites en un entorno serverless).

## Estado del proyecto / próximos pasos

- Las fotografías de inicio, sedes, eventos y galería son fotos reales
  entregadas por la institución. Las tarjetas de eventos/noticias sin foto
  adecuada (olimpiadas, día de la familia) usan el escudo institucional.
  El rector aún no tiene fotografía (se muestra un ícono).
- El personal docente proviene del documento oficial de docentes
  (`js/data/docentes.js`). El documento no indica la sede de cada docente;
  cuando la institución la confirme, se agrega el campo `sede` al registro.
- El PEI, el calendario institucional y el proceso de matrícula muestran
  su estructura lista para publicarse; el contenido específico y las
  fechas quedan marcados como pendientes de confirmación.
- Las noticias son contenido estático de ejemplo; la estructura de tarjetas
  permite conectarlas a una fuente de datos real en el futuro sin cambiar
  el diseño.
