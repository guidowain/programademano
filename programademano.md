# ProgramaDeMano.com.ar

App Next.js para publicar programas de mano digitales. Cada obra tiene una URL pública, sus páginas viven en Cloudinary y el contenido se gestiona desde un admin privado.

## Flujo público

- URL de programa: `https://programademano.com.ar/{slug}`.
- Ejemplo: `https://programademano.com.ar/miamigayyo`.
- La app lee las páginas desde Cloudinary y las muestra en scroll continuo.
- Si el programa tiene link de entradas, al final aparece un botón de WhatsApp:
  - primera línea: `RECOMENDÁ`;
  - segunda línea: nombre de la obra;
  - mensaje: `Te recomiendo ir a ver "{Nombre de la obra}" {link de entradas}`.
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

El `Slug` define la carpeta de Cloudinary y la URL pública. Por ejemplo:

```text
Nombre: Mi amiga y yo
Slug: miamigayyo
URL: /miamigayyo
Carpeta: programa-de-mano/miamigayyo
```

## Cloudinary

Cloudinary es la fuente de contenido. GitHub queda solo para código.

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

- `public/programas` ya no se usa.
- No hace falta deploy para cambiar programas, páginas, orden, nombre o link de entradas.
- Los cambios de contenido se hacen desde `/admin` y quedan guardados en Cloudinary.
