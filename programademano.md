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

Cada programa vive como subcarpeta:

```text
programa-de-mano/lacenadelostontos
```

El orden público sale de `order` si existe; si no existe, se toma el primer número del nombre/public ID. Por ejemplo:

```text
1_lgwilg.webp -> página 1
2_ift9kq.webp -> página 2
10_san3yv.webp -> página 10
```

Las páginas subidas desde el admin también se guardan con metadata/context:

```text
order=1
slug=lacenadelostontos
```

Esto permite subir imágenes manualmente a Cloudinary o desde el admin sin perder el orden.

## Scripts

```bash
npm run dev
npm run build
npm run start
```

## Notas

- GitHub queda como fuente de código.
- Cloudinary pasa a ser la fuente de contenido.
- Las imágenes viven en Cloudinary; `public/` solo contiene assets estáticos de la app.
