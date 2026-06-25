# ProgramaDeMano.com.ar

App Next.js para publicar programas de mano digitales. Cada obra tiene una URL pública y sus páginas pueden vivir como archivos estáticos en `public/programas` o, para programas administrables desde el panel, en Cloudinary.

## Flujo público

- URL de programa: `https://programademano.com.ar/{slug}`.
- Ejemplo: `https://programademano.com.ar/miamigayyo`.
- La app lee las páginas del programa y las muestra en scroll continuo.
- Si el programa tiene link de entradas, al final aparece un botón para recomendar:
  - primera línea: `RECOMENDÁ`;
  - segunda línea: nombre de la obra;
  - mensaje: `Te recomiendo ir a ver "{Nombre de la obra}"` y abajo `{link de entradas}`.
  - en mobile abre el share sheet nativo; si el navegador no lo soporta, abre WhatsApp.
- Si no hay link de entradas cargado, el botón no aparece.

## Admin

El panel vive en `/admin` y usa usuario/contraseña.

Desde el admin se puede:

- crear programas con `Nombre`, `Slug` y `Link entradas`;
- editar nombre, slug y link de entradas;
- subir páginas en batch;
- reordenar páginas con flechas;
- borrar páginas;
- borrar programas completos;
- abrir la URL pública de cada programa.
- ver métricas simples por programa: 30 días, total y recomendaciones.

El `Slug` define la URL pública y, para programas dinámicos, la carpeta de Cloudinary. Por ejemplo:

```text
Nombre: Mi amiga y yo
Slug: miamigayyo
URL: /miamigayyo
Carpeta: programa-de-mano/miamigayyo
```

## Cloudinary

Cloudinary queda como fuente de contenido para programas dinámicos creados desde el admin. Los programas de bajo cambio pueden alojarse como archivos estáticos en `public/programas/{slug}` y declararse en `STATIC_PROGRAMS`.

Carpeta base:

```text
programa-de-mano
```

Cada programa vive en:

```text
programa-de-mano/{slug}
```

El orden de páginas se resuelve así:

- primero se usa metadata/context `order`, si existe;
- si no existe, se usa el primer número del nombre/public ID;
- ejemplo: `1_portada`, `2_elenco`, `10_creditos`.

Al subir desde el admin:

- varias imágenes seleccionadas se ordenan entre sí por el primer número del filename;
- las nuevas páginas se agregan al final del programa;
- luego se pueden ajustar con flechas.

La metadata general de programas se guarda como raw JSON en Cloudinary, bajo:

```text
programa-de-mano-metadata
```

## Variables de entorno

```bash
ADMIN_USERNAME=
ADMIN_PASSWORD=
JWT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

NEXT_PUBLIC_GA_MEASUREMENT_ID=
GOOGLE_ANALYTICS_PROPERTY_ID=
GOOGLE_ANALYTICS_CLIENT_ID=
GOOGLE_ANALYTICS_CLIENT_SECRET=
GOOGLE_ANALYTICS_REFRESH_TOKEN=
```

Estas variables deben existir localmente y en Vercel.

## Desarrollo

```bash
npm run dev
npm run build
npm run start
```

## Estructura

```text
app/
  [slug]/page.tsx              # visor público
  admin/                       # backoffice
  api/                         # auth y endpoints admin
lib/
  auth.ts
  cloudinary.ts
public/
  logos/
```

## Notas

- Los programas en `public/programas` requieren commit y deploy para cambiar imágenes, orden, nombre o link de entradas.
- Los programas dinámicos se cambian desde `/admin` y quedan guardados en Cloudinary.
