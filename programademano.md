# ProgramaDeMano.com.ar

Sistema simple para mostrar programas de mano teatrales en formato digital.

## Cómo funciona ahora

- El público entra a una URL como `programademano.com.ar/lacenadelostontos`.
- La app busca las páginas de ese programa en Cloudinary.
- Las imágenes se muestran en scroll continuo, pantalla limpia y sin controles.
- El contenido se administra desde `/admin`, sin tocar el repo ni hacer deploy manual.

## Admin

El panel vive en `/admin` y está protegido con usuario/contraseña.

Variables necesarias:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
JWT_SECRET=change-me-to-a-long-random-secret

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Desde el admin se puede:

- crear programas por slug;
- subir imágenes;
- reordenar páginas con flechas;
- borrar páginas;
- borrar programas completos;
- abrir la URL pública del programa.

## Cloudinary

Carpeta base:

```text
programa-de-mano/{slug}
```

Cada página se guarda como imagen con metadata/context:

```text
order=1
slug=lacenadelostontos
```

El orden público depende de `order`; si falta, se usa el número del public ID como fallback.

## Migración inicial

Los programas existentes en `public/programas` se pueden subir con:

```bash
node scripts/migrate-programas-to-cloudinary.mjs --dry-run
node scripts/migrate-programas-to-cloudinary.mjs
```

El dry-run muestra qué se va a subir. La ejecución real requiere las variables de Cloudinary.

## Scripts

```bash
npm run dev
npm run build
npm run start
```

## Notas

- GitHub queda como fuente de código.
- Cloudinary pasa a ser la fuente de contenido.
- Las imágenes locales pueden quedarse como respaldo histórico, pero la app pública ya no las usa.
