"""Genera la página legal (aviso legal + privacidad + cookies) de la web de un cliente.

Uso:  python3 _legal/generar.py _legal/clientes/raco-de-piscis.json
Crea  <carpeta>/legal/index.html. Los datos que falten se quedan entre [CORCHETES]:
no enlaces la página hasta rellenarlos todos (comprueba con: grep -n "\\[" <carpeta>/legal/index.html).
"""
import json, sys, html, pathlib

c = json.load(open(sys.argv[1]))
e = lambda k: html.escape(c.get(k) or f"[{k.upper()}]")
reservas = c.get("reservas", True)

privacidad = f"""
<h2>Reservas: qué datos y para qué</h2>
<p><b>Responsable:</b> {e('titular')}, NIF {e('nif')}, {e('domicilio')}, <a href="mailto:{e('email')}">{e('email')}</a>.</p>
<p><b>Datos:</b> nombre, teléfono, correo y los datos de tu reserva (servicio, día, hora y la nota opcional).</p>
<p><b>Finalidad:</b> gestionar tu reserva, enviarte la confirmación y avisarte si hay cambios.</p>
<p><b>Base legal:</b> la reserva que nos pides (ejecución de un contrato o medidas precontractuales a petición tuya).</p>
<p><b>Conservación:</b> hasta {c.get('meses_conservacion', 12)} meses después de la cita, salvo que la ley obligue a conservarlos más tiempo.</p>
<p><b>Quién más los trata:</b> The Sqvare, que mantiene la web y el sistema de reservas por encargo de {e('negocio')}, y Google, que aloja los datos y envía los correos (con las garantías del RGPD para datos tratados fuera de la UE). No se ceden a nadie más.</p>
""" if reservas else """
<h2>Tus datos</h2>
<p>Esta web no tiene formularios ni recoge datos personales.</p>
"""

out = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aviso legal y privacidad · {e('negocio')}</title>
<meta name="robots" content="noindex">
<style>
:root{{--ink:#1d1d1b;--gris:#6b6b66;--fondo:#faf8f4;--linea:#e4e0d8}}
@media (prefers-color-scheme:dark){{:root{{--ink:#f1efe9;--gris:#a8a69f;--fondo:#171716;--linea:#2c2c2a}}}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--fondo);color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
main{{max-width:720px;margin:0 auto;padding:48px 20px 72px}}
h1{{font-size:clamp(1.6rem,5vw,2.2rem);line-height:1.15;margin:0 0 6px}}
h2{{font-size:1.05rem;margin:34px 0 8px;padding-top:18px;border-top:1px solid var(--linea)}}
p{{margin:0 0 10px}} a{{color:inherit}} .meta,.back{{color:var(--gris);font-size:.9rem}}
</style>
</head>
<body>
<main>
<a class="back" href="../">← Volver a {e('negocio')}</a>
<h1>Aviso legal y privacidad</h1>
<p class="meta">Última actualización: {c.get('fecha','octubre de 2026')}</p>

<h2>Titular de la web</h2>
<p>{e('titular')} · NIF {e('nif')}<br>Domicilio: {e('domicilio')}<br>Correo: <a href="mailto:{e('email')}">{e('email')}</a></p>
<p>Esta web informa sobre los servicios de {e('negocio')}. Los textos, fotos y logotipos pertenecen a su titular o se usan con permiso. Las opiniones mostradas son reseñas públicas de clientes, citadas de su fuente. Diseño y mantenimiento: The Sqvare.</p>
{privacidad}
<h2>Tus derechos</h2>
<p>Puedes pedir acceder a tus datos, corregirlos, borrarlos u oponerte a su uso escribiendo a <a href="mailto:{e('email')}">{e('email')}</a>. Si crees que no te hemos atendido bien, puedes reclamar ante la <a href="https://www.aepd.es" rel="noopener">Agencia Española de Protección de Datos</a>.</p>

<h2>Cookies y servicios externos</h2>
<p>Esta web no usa cookies de analítica ni de publicidad. El mapa lo muestra Google Maps y las tipografías pueden cargarse desde Google Fonts: al visitar la web, estos servicios reciben tu dirección IP y Google Maps puede usar sus propias cookies, según la política de privacidad de Google.</p>
</main>
</body>
</html>
"""
dest = pathlib.Path(c["carpeta"]) / "legal" / "index.html"
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(out)
falta = out.count("[")
print(dest, "· datos pendientes:" if falta else "· completa", falta or "")
