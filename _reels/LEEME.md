# Kit de reels de The Sqvare

Genera reels verticales (1080×1920, 15 s, 30 fps) que muestran una web real funcionando en un móvil:
el dedo desliza, toca, reserva, y al final sale la tarjeta de The Sqvare ("Tu web, lista para vender · Escríbenos por DM").
Esta carpeta empieza por `_`, así que GitHub Pages no la publica en la web.

## Preparación (una vez por sesión)

```bash
cd _reels
mkdir -p ~/.local/share/fonts && cp fonts/*.ttf ~/.local/share/fonts/ && fc-cache -f
mkdir -p trabajo
```
Hace falta Python con `playwright`, `Pillow` y `numpy`, Chromium (ya instalado en el entorno) y `ffmpeg`.

## Formatos (cada uno dura 12,5 s de móvil + 2,5 s de cierre)

| Formato | Spec | Qué se ve | Ventanas de texto (s) |
| --- | --- | --- | --- |
| web | `spec_web.py` | thesqvare.com pantalla a pantalla, desliza ejemplos y packs, toca "Escríbeme por Instagram" | 0,15–2,3 · 2,3–4,9 · 4,9–7,8 · 7,8–10,2 · 10,2–12,5 |
| barber | `spec_barber.py` | TheSqvare Barber: portada, servicios, reserva completa y notificación de correo | 0,15–2,3 · 2,3–4,6 · 4,6–7,5 · 7,5–9,9 · 9,9–12,5 |
| bar | `spec_bar.py` | TheSqvare Bar: portada, carta con fotos, reserva de mesa y notificación | 0,15–2,3 · 2,3–4,9 · 4,9–7,5 · 7,5–9,9 · 9,9–12,5 |

Ejemplos de configuración en `ejemplos/` (`web.json`, `barber.json`, `bar.json`) y los sonidos de cada formato en `ejemplos/sonidos.json`.

## Hacer un reel

1. Copia el JSON de ejemplo del formato a `trabajo/AAAA-MM-DD.json` y cambia:
   - `caps`: los textos. Cada entrada es `[inicio, fin, [línea1, línea2]]` y cada línea es una lista de trozos `[texto, 1 si va en lima / 0 si va en crema]`. Respeta las ventanas de tiempo del formato. Máximo 2 líneas y unos 20 caracteres por línea.
   - `frames`, `out` y `sfx`: rutas dentro de `trabajo/` con la fecha, para no pisar otros reels.
   - `notif` (solo barber y bar): título y dos líneas de la notificación de correo.
2. Graba la pantalla (unos 2 minutos): `python3 capture.py spec_FORMATO.py trabajo/frames_FECHA`
3. Sonido: `python3 sonido.py trabajo/sonido_FECHA.wav "$(python3 -c "import json;print(json.dumps(json.load(open('ejemplos/sonidos.json'))['FORMATO']))")"`
4. Monta el vídeo (unos 70 s): `python3 montar.py trabajo/FECHA.json`
5. Revisa 4-5 fotogramas con `ffmpeg -ss T -i trabajo/reel.mp4 -frames:v 1 x.png` antes de publicarlo.
6. Copia el vídeo a `ig/AAAA-MM-DD/reel.mp4` en la raíz del repositorio, haz commit y push a `main`.
7. Prográmalo en Metricool como reel: `instagramData: {"type": "REEL", "showReelOnFeed": true}` y como media
   `https://raw.githubusercontent.com/DavidCuados7/thesqvare-web/main/ig/AAAA-MM-DD/reel.mp4`.

## Reglas de contenido

- Nunca nombres Santa Coloma ni ninguna ciudad en textos, imágenes o hashtags.
- Nunca pongas el teléfono de David. El contacto es "Escríbenos por DM" o thesqvare@gmail.com.
- No se ve la cara de David ni de nadie: solo la pantalla del móvil.
- Nunca grabes la web de Barber Prince (`barber-prince/`): es de un cliente potencial y no se enseña.
- Cada semana usa textos nuevos y apúntalos en `historial.md` para no repetirlos.
- Graba SOLO las webs que aparecen en thesqvare.com: la propia web (`index.html`), TheSqvare Bar (`thesqvare-bar/`) y TheSqvare Barber (`thesqvare-barber/`). Nunca inventes negocios ni páginas demo nuevas. Si en el futuro se añaden más ejemplos a la sección Ejemplos de thesqvare.com, se puede crear un `spec_` para ellos.
- La variedad viene de los textos: cada día un gancho distinto aunque se repita el formato.
