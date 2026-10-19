---
name: The Sqvare
description: Webs para negocios locales: bloques de color firmes, tipografía contundente y sombras duras.
colors:
  ultramar-cuadrado: "#2A35F0"
  sol-acento: "#FFC83D"
  papel-claro: "#F3F4FA"
  noche-fondo: "#0C0E1A"
  superficie-noche: "#161A2E"
  gris-secundario: "#9097B8"
  trazo-noche: "#2A2F4C"
typography:
  display:
    fontFamily: "Unbounded, Arial Black, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 7.4vw, 6.4rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Unbounded, Arial Black, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 4.8vw, 4rem)"
    fontWeight: 800
    lineHeight: 1.02
  title:
    fontFamily: "Unbounded, Arial Black, system-ui, sans-serif"
    fontSize: "clamp(1.05rem, 1.6vw, 1.3rem)"
    fontWeight: 600
    lineHeight: 1.02
  body:
    fontFamily: "Instrument Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "0.78rem"
    fontWeight: 400
    letterSpacing: "0.14em"
rounded:
  none: "0px"
spacing:
  slide-inline: "max(20px, 6vw)"
  slide-block: "88px"
  grid-gap: "clamp(20px, 3vw, 36px)"
components:
  button-primary:
    backgroundColor: "{colors.sol-acento}"
    textColor: "{colors.noche-fondo}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "14px 22px"
  button-primary-hover:
    backgroundColor: "{colors.sol-acento}"
    textColor: "{colors.noche-fondo}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.papel-claro}"
    rounded: "{rounded.none}"
    padding: "14px 22px"
  card-browser:
    backgroundColor: "{colors.superficie-noche}"
    rounded: "{rounded.none}"
---

# Design System: The Sqvare

## Overview

**Creative North Star: "El cuadrado editorial"**

The Sqvare se ve como una revista de barrio bien hecha: bloques de color planos, tipografía gruesa en Unbounded y un ritmo de pantallas completas que se suceden como páginas. Nada es redondo. El cuadrado es la forma de la marca, y se repite en el logo, en los botones, en las sombras y en la rejilla de la portada.

La densidad es baja. Cada pantalla dice una cosa, con un titular grande y un texto corto debajo. El contraste se consigue cambiando de fondo entre pantallas (noche, papel, azul, dorado), no con decoración.

La voz visual es cercana y directa, igual que el texto: frases cortas, sin ornamento que no sirva.

**Key Characteristics:**
- Formas rectas y bloques de color, sin esquinas redondeadas.
- Titulares gruesos en Unbounded con una palabra destacada en fondo dorado o en color sol.
- Sombras duras de color, sin difuminar.
- Una pantalla por bloque de color de fondo.

## Colors

Paleta de cinco colores de marca más dos neutros de superficie. El dorado es el acento que pide atención; el azul es el color de bloque.

### Primary
- **Ultramar cuadrado** (#2A35F0): fondo de la portada y de la sección de proceso. Color de marca; también sombra de los bloques oscuros.
- **Sol acento** (#FFC83D): botón principal, palabras destacadas (`.hl`, `.box`), puntos de navegación activos y la esquina del logo.

### Secondary
- **Papel claro** (#F3F4FA): texto sobre fondos oscuros y fondo de la sección de servicios y del pack destacado.

### Tertiary
- **Trazo noche** (#2A2F4C): bordes de tarjetas y separadores sobre fondos oscuros.

### Neutral
- **Noche fondo** (#0C0E1A): fondo principal de la web y texto sobre dorado.
- **Superficie noche** (#161A2E): tarjetas y bloques elevados sobre el fondo.
- **Gris secundario** (#9097B8): texto de apoyo, etiquetas de contador y descripciones.

### Named Rules
**The Un-Shade Rule.** Los colores son planos. No hay degradados de marca; la única excepción son las maquetas de ejemplo, que son ficticias.

**The One Gold Rule.** El dorado aparece en el botón principal y en una palabra por pantalla. Su rareza es lo que lo hace visible.

## Typography

**Display Font:** Unbounded (con Arial Black como respaldo)
**Body Font:** Instrument Sans (con Helvetica Neue como respaldo)
**Label/Mono Font:** JetBrains Mono

**Character:** Unbounded grita con peso 800 y casi sin interlineado; Instrument Sans da el texto normal con calma; JetBrains Mono pone las etiquetas pequeñas, como anotaciones de ficha técnica.

### Hierarchy
- **Display** (800, clamp(2.4rem, 7.4vw, 6.4rem), line-height 1.02): titular de portada, una o dos líneas.
- **Headline** (800, clamp(1.9rem, 4.8vw, 4rem), line-height 1.02): titular de cada pantalla.
- **Title** (600, clamp(1.05rem, 1.6vw, 1.3rem)): subtítulos y textos de botón.
- **Body** (400, 17px, line-height 1.55): párrafos. Máximo 60 caracteres por línea (`p{max-width:60ch}`).
- **Label** (400, 0.78rem, letter-spacing 0.14em, mayúsculas): etiquetas, colofón, pie de página.

### Named Rules
**The Highlight Box Rule.** Una palabra del titular puede ir en un recuadro dorado (`.box`) con texto noche. Solo una por titular.

## Layout

Pantallas de altura completa con `scroll-snap-type: y mandatory`. Cada pantalla es una sección con su propio color de fondo. El contenido va centrado en un contenedor de hasta 1180px, con rejilla de dos columnas en la portada y de cuatro en servicios y proceso.

Espaciado: padding de sección 88px arriba y 56px abajo; lateral `max(20px, 6vw)`; huecos de rejilla `clamp(20px, 3vw, 36px)`.

En móvil (menos de 600px) cada pantalla ocupa el alto de la ventana, con una pantalla por deslizamiento, y se ocultan las secciones marcadas `m-hide`. Entre 600 y 900px las rejillas de cuatro pasan a dos columnas.

## Elevation & Depth

Sistema plano con sombras duras de color. Las superficies están planas en reposo. La profundidad aparece como desplazamiento sólido de 3 a 8 px en azul, dorado o papel, sin difuminar. Al pasar el ratón sobre un botón se desplaza en diagonal y su sombra pasa a papel.

### Shadow Vocabulary
- **Sombra de botón en reposo** (`box-shadow: 3px 3px 0 var(--papel)`): botones pequeños.
- **Sombra de botón en hover** (`box-shadow: 7px 7px 0 var(--papel)`, con `transform: translate(-2px, -2px)`): botón principal al pasar el ratón.
- **Sombra de bloque destacado** (`box-shadow: 8px 8px 0 var(--sol)`): pack destacado.
- **Sombra de tarjeta real** (`box-shadow: 6px 6px 0 var(--azul)`): muestras de clientes reales.

### Named Rules
**The Hard Shadow Rule.** Las sombras son sólidas y sin difuminar. Nunca usar `blur`.

## Shapes

Todo es recto: `border-radius` sin valor, bordes de 2 a 3 px, bloques cuadrados. La forma del logo (marco cuadrado con esquina dorada) es el origen de todos los bloques de la web. Las tarjetas de muestra y las pantallas de móvil también son rectangulares.

## Components

Cada componente es un bloque cuadrado con borde o sombra sólida. Ningún componente se redondea.

### Buttons
- **Shape:** rectángulo recto (border-radius 0).
- **Primary:** fondo sol (#FFC83D), texto noche (#0C0E1A), tipografía Unbounded 600 en 0.92rem, padding 14px 22px.
- **Hover / Focus:** desplazamiento de -2px en ambos ejes y sombra papel de 7px. El foco usa un contorno dorado de 3px con separación de 3px.
- **Ghost:** fondo transparente, texto papel, contorno papel de 2px hacia dentro.

### Chips (if used)
- **Style:** borde noche de 3px, fondo sol, texto Unbounded 600 en tamaño fluido.
- **State:** al pasar el ratón se invierte: fondo noche, texto sol.

### Cards / Containers
- **Corner Style:** rectas.
- **Background:** superficie noche (#161A2E) sobre fondo noche.
- **Shadow Strategy:** sombra dura de color, ver Elevation & Depth.
- **Border:** 2px trazo noche (#2A2F4C) en tarjetas de muestra.
- **Internal Padding:** 22-28px.

### Inputs / Fields
No hay campos de formulario en la página de presentación. Los formularios de las webs de ejemplo siguen el mismo estilo de bloques rectos, sin documentar aquí.

### Navigation
- **Style:** logo a la izquierda (marco 26px en papel con esquina dorada, texto Unbounded 800), botón principal a la derecha.
- **Mobile treatment:** la barra superior se queda fija con un degradado oscuro sobre la primera pantalla.
- **Dots:** cuadrados de 12px con borde papel; el activo se rellena de sol y se agranda un 25%.

### The Square Logo (signature)
Marco de 3px en color papel con un cuadro sol de 11px en la esquina inferior derecha, seguido del texto THE SQVARE. No se modifica ni se recolorea.

## Do's and Don'ts

### Do:
- **Do** usar un solo fondo de color por pantalla y alternar entre noche, papel, azul y dorado.
- **Do** usar Unbounded 800 para titulares y JetBrains Mono para etiquetas pequeñas.
- **Do** usar sombras sólidas de 3 a 8 px en azul, dorado o papel.
- **Do** mantener las esquinas rectas en todo elemento nuevo.

### Don't:
- **Don't** usar `border-radius` en botones, tarjetas o bloques.
- **Don't** usar sombras difuminadas (`blur`) ni degradados de marca.
- **Don't** poner más de una palabra destacada en dorado por titular.
- **Don't** recolorear ni modificar el logo.
- **Don't** usar colores de apps de reservas reales ni sus logos.
