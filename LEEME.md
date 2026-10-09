# The Sqvare · cómo publicar y mantener la web

Alojamiento **gratis** con GitHub Pages (incluye HTTPS). Lo único que se paga es el dominio `thesqvare.com` en un registrador (Cloudflare, Porkbun, Namecheap…), normalmente unos 10–12 € al año. Ningún servicio de este paquete cobra nada más.

## 1. Subir la web (una sola vez)
1. Crea una cuenta gratis en github.com.
2. Nuevo repositorio público llamado `thesqvare-web`.
3. "Add file → Upload files" y arrastra **todo** el contenido de esta carpeta (incluida la carpeta `.github`; si el navegador no la sube, créala con "Add file → Create new file" escribiendo `.github/workflows/vigilancia.yml` y pegando su contenido).
4. Settings → Pages → Source: "Deploy from a branch", rama `main`, carpeta `/ (root)` → Save.
5. En "Custom domain" escribe `thesqvare.com` → Save.

## 2. Conectar el dominio (en tu registrador, apartado DNS)
| Tipo | Nombre | Valor |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | TU-USUARIO.github.io |

Espera entre 10 minutos y unas horas. Después marca **Enforce HTTPS** en Settings → Pages.

## 3. Actualizar la web cuando quieras
Abre `index.html` en GitHub → icono del lápiz → cambia el texto → "Commit changes". En 1–2 minutos está online.
Cada pantalla está marcada con un comentario `PANTALLA 1 · PORTADA`, `PANTALLA 7 · PACKS`… para que encuentres rápido qué tocar.
**Ahora mismo** la web está en https://davidcuados7.github.io/thesqvare-web/ (sin dominio). Cuando compres thesqvare.com, pide a Claude que lo conecte (vuelve a añadir el archivo CNAME y cambia la vigilancia).

## 4. Vigilancia diaria a las 5:00
El archivo `.github/workflows/vigilancia.yml` se ejecuta solo cada día a las 5:00 (hora de Madrid):
- Comprueba que `thesqvare.com` y `www.thesqvare.com` cargan y muestran la web.
- Comprueba que el certificado HTTPS no está a punto de caducar.
- Si algo falla, **vuelve a publicar la web automáticamente** y te crea un aviso ("Issue") en GitHub, que te llega por **email** y a la app de GitHub en el móvil.
- Si todo va bien, no te molesta.

Para probarlo a mano: pestaña Actions → "Vigilancia diaria 5:00" → Run workflow.
Activa los avisos: en el repositorio, botón **Watch → All Activity**.
