# ProgramaDeMano.com.ar — MVP

## 🧠 Qué es esto

Un sistema ultra simple para mostrar programas de mano teatrales en formato digital.

La idea es:
- El usuario escanea un QR en el teatro
- Se abre una URL tipo:
  programademano.com.ar/lacenadelostontos
- Y ve directamente el programa (PDF) en pantalla completa, sin distracciones

---

## 🎯 Objetivo del MVP

Resolver esto con la menor complejidad posible:

- Sin base de datos
- Sin backoffice real
- Sin uploads desde la web
- Sin procesamiento de PDF
- Sin diseño innecesario

Solo:
👉 mostrar PDFs de forma limpia

---

## ⚙️ Cómo funciona

### 1. Los PDFs viven en el repo

Ubicación:
/public/programas/

Ejemplo:
/public/programas/lacenadelostontos.pdf

---

### 2. La URL se arma automáticamente

Regla:
{nombre del archivo}.pdf → /{nombre}

Ejemplo:
lacenadelostontos.pdf → programademano.com.ar/lacenadelostontos

---

### 3. Next.js renderiza el visor

Archivo clave:
/app/[slug]/page.tsx

Lógica:
const pdfPath = `/programas/${params.slug}.pdf`;

Se embebe en un iframe fullscreen:

<iframe
  src={pdfPath}
  style={{
    width: "100vw",
    height: "100vh",
    border: "none",
  }}
/>

---

## 🧩 Estructura del proyecto

app/
  [slug]/
    page.tsx
  layout.tsx
  page.tsx

public/
  programas/
    *.pdf

package.json
next.config.js

---

## 🚀 Flujo de uso

Para agregar un programa nuevo:

1. Exportás el PDF final
2. Lo nombrás correctamente (ej: chantas.pdf)
3. Lo subís a:
/public/programas/
4. Deploy en Vercel

La URL queda:
/chantas

---

## ⚠️ Limitaciones del MVP

- No hay validación
- No hay admin panel
- No hay subida desde UI
- Requiere deploy para actualizar
- El visor depende del navegador

---

## 🧠 Decisión técnica

Se eligió simplicidad total:

- Sin Cloudinary
- Sin base de datos
- Sin conversión a imágenes

---

## 🔜 Futuro

- Versión con imágenes para mejor mobile
- Backoffice con login
- Upload automático
- Analytics

---

## 💡 Idea de negocio

Reemplazar programas físicos por digitales.

Cada obra tiene:
- su URL
- su QR
- su programa digital

Escalable a sponsors, links, métricas, etc.

---

## 🧾 Resumen

- Subís PDF a /public/programas/
- El nombre define la URL
- Next lo muestra fullscreen
- Deploy → listo

---

## 🔥 Filosofía

Primero que funcione.
Después se mejora.
