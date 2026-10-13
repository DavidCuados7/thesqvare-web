"""Capa que tapa la web al principio del reel y desaparece con un glitch.
- ANTES_*: una web antigua y fea del mismo negocio (formato "antes y después").
- PLATAFORMA_*: una app de reservas genérica de terceros (formato "plataforma vs. web propia").
No imita ninguna app real: sin nombres, logos ni colores de marcas existentes."""
import os, importlib.util

ANTES_BARBER = """
<h1o>THESQVARE BARBER</h1o>
<div class="bar">Inicio | Servicios | Precios | Contacto</div>
<div class="mq">*** PIDE TU CITA LLAMANDO POR TELEFONO ***</div>
<p>Peluqueria de caballeros. Abierto de lunes a sabado.</p>
<div class="broken">[imagen no disponible]</div>
<p>Precios: preguntar en el local.</p>
<p>Para coger cita llamar en horario de tienda. No se dan citas por internet.</p>
<p style="color:#c00">Pagina en construccion</p>
<div class="hit">Visitante n&ordm; 000412 &middot; Optimizado para Internet Explorer 6</div>"""

ANTES_BAR = """
<h1o>THESQVARE BAR</h1o>
<div class="bar">Inicio | La carta | Menu | Contacto</div>
<div class="mq">*** MENU DEL DIA: CONSULTAR EN LA PIZARRA ***</div>
<p>Bar restaurante. Cocina casera y tapas.</p>
<div class="broken">[carta.pdf no encontrado]</div>
<p>Reservas solo por telefono. No se aceptan reservas por internet.</p>
<p style="color:#c00">Pagina en construccion</p>
<div class="hit">Visitante n&ordm; 000298 &middot; Optimizado para Internet Explorer 6</div>"""

def _plataforma(cat, nuestro, otros):
    filas = ''.join(f"""<div class="it{' sp' if i == 0 else ''}"><div class="ph"></div><div><b>{n}</b><span>★ {r} · {d}</span>{'<em>Patrocinado</em>' if i == 0 else ''}</div></div>"""
                    for i, (n, r, d) in enumerate(otros[:2] + [(nuestro, '4,7', '0,8 km')] + otros[2:]))
    return f"""
<div class="pl">
 <div class="top"><div class="ic"></div><b>Reservas</b><span>Iniciar sesión</span></div>
 <div class="sr">🔍 {cat} cerca de ti</div>
 <div class="ad">ANUNCIO · ¡2x1 en tu primera visita en otro local!</div>
 {filas}
 <div class="sheet" id="__sheet"><div class="grab"></div><b>Crea una cuenta para reservar</b>
  <span>Regístrate o descarga la app para continuar</span>
  <div class="b1">Descargar la app</div><div class="b2">Continuar con correo</div></div>
</div>"""

PLATAFORMA_BARBER = _plataforma('Barberías', 'TheSqvare Barber',
    [('Barbería Norte', '4,9', '2,3 km'), ('Corte &amp; Co', '4,8', '1,1 km'), ('Estudio Fade', '4,6', '1,9 km'), ('Navaja 21', '4,5', '3,0 km')])
PLATAFORMA_BAR = _plataforma('Restaurantes', 'TheSqvare Bar',
    [('Taberna del Puerto', '4,9', '2,1 km'), ('La Brasa Nueva', '4,8', '1,4 km'), ('Casa Lola', '4,6', '1,7 km'), ('Tapas 33', '4,5', '2,8 km')])

CSS = """#__old{position:fixed;inset:0;z-index:2147483646;background:#fff;color:#000;overflow:hidden}
#__old.antes{font-family:"Times New Roman",FreeSerif,serif;padding:14px 10px}
#__old h1o{display:block;font-size:30px;font-weight:bold;color:#00c;text-decoration:underline}
#__old p{font-size:15px;margin:8px 0}
#__old .bar{background:#c0c0c0;border:2px outset #eee;padding:4px;font-size:13px;margin:10px 0}
#__old .mq{color:red;font-size:14px;white-space:nowrap}
#__old .hit{font-size:12px;color:#555;margin-top:22px}
#__old .broken{width:150px;height:90px;border:1px solid #999;display:grid;place-items:center;font-size:11px;color:#777;margin:10px 0}
#__old .pl{font-family:Inter,sans-serif;background:#f2f2f4;min-height:100%;padding-bottom:20px}
#__old .top{display:flex;align-items:center;gap:10px;background:#fff;padding:14px 16px;border-bottom:1px solid #e3e3e8}
#__old .top .ic{width:28px;height:28px;border-radius:8px;background:#6b7280}
#__old .top b{font-size:18px;flex:1}#__old .top span{font-size:13px;color:#6b7280}
#__old .sr{margin:12px 16px;background:#fff;border:1px solid #dcdce2;border-radius:12px;padding:12px;font-size:14px;color:#6b7280}
#__old .ad{margin:0 16px 10px;background:#fff7d6;border:1px dashed #e0b400;border-radius:10px;padding:10px;font-size:12px;font-weight:600;color:#7a5b00}
#__old .it{display:flex;gap:12px;align-items:center;background:#fff;margin:8px 16px;border-radius:14px;padding:10px;border:1px solid #e6e6ec}
#__old .it.sp{border-color:#c7c7d1}
#__old .ph{width:64px;height:64px;border-radius:10px;background:linear-gradient(135deg,#d6d6de,#b9b9c4);flex:none}
#__old .it b{display:block;font-size:15px}#__old .it span{font-size:12.5px;color:#6b7280}
#__old .it em{display:inline-block;margin-top:4px;font-style:normal;font-size:10.5px;font-weight:700;background:#ececf1;color:#4b5563;padding:2px 7px;border-radius:6px}
#__old .sheet{position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:22px 22px 0 0;padding:14px 20px 34px;box-shadow:0 -10px 40px rgba(0,0,0,.25);transform:translateY(110%)}
#__old .grab{width:44px;height:5px;border-radius:5px;background:#d1d1d8;margin:0 auto 14px}
#__old .sheet b{display:block;font-size:20px;margin-bottom:6px}#__old .sheet span{font-size:14px;color:#6b7280}
#__old .b1,#__old .b2{margin-top:14px;text-align:center;font-weight:700;padding:14px;border-radius:12px;font-size:15px}
#__old .b1{background:#374151;color:#fff}#__old .b2{border:1.5px solid #c7c7d1;color:#374151}"""

def init_js(html, antes):
    cls = 'antes' if antes else ''
    return ("(()=>{const s=document.createElement('style');s.textContent=" + repr(CSS) + ";document.head.appendChild(s);"
            "const d=document.createElement('div');d.id='__old';d.className=" + repr(cls) + ";d.innerHTML=" + repr(html) + ";document.body.appendChild(d);})()")

def frame_js(t, end, sheet_at=None):
    og = max(0.0, min(1.0, (t - (end - .4)) / .35))
    js = (f"(()=>{{const o=document.getElementById('__old');if(!o)return;o.style.opacity={1 - og:.3f};"
          f"o.style.transform='translateX({__import__('math').sin(t * 90) * 14 * og:.1f}px) skewX({og * 8:.2f}deg)';"
          f"o.style.filter='{'none' if og == 0 else f'hue-rotate({og * 180:.0f}deg) contrast({1 + og * 2:.2f})'}';"
          f"o.style.display='{'none' if t > end + .05 else 'block'}';")
    if sheet_at is not None:
        p = max(0.0, min(1.0, (t - sheet_at) / .35)); p = 1 - (1 - p) ** 3
        js += f"const sh=document.getElementById('__sheet');if(sh)sh.style.transform='translateY({(1 - p) * 110:.1f}%)';"
    return js + "})();"

def load(name):
    here = os.path.dirname(os.path.abspath(__file__))
    sp = importlib.util.spec_from_file_location(name, os.path.join(here, name)); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m

def build(base_name, html, antes, end, shift, sheet_at=None):
    """Devuelve (URL, DURATION, CSS, PRE_JS, INIT_JS, step) para un spec con capa inicial."""
    base = load(base_name)
    f = round(shift * 30) / 30
    def step(t):
        st = base.step(max(0.0, t - f)) if t >= f else base.step(0.0)
        if t < end:  # mientras la capa tapa la web, nada de toques
            st = {'js': st.get('js', '')}
        st['js'] = st.get('js', '') + frame_js(t, end, sheet_at)
        if t < end and sheet_at is not None and t >= sheet_at + .5 and t < end - .3:
            st['js'] += ("(()=>{const b=document.querySelector('#__old .b1');if(!b)return;const r=b.getBoundingClientRect();"
                         "const e=document.getElementById('__touch');e.style.left=(r.left+r.width/2)+'px';e.style.top=(r.top+r.height/2)+'px';"
                         f"e.style.opacity={max(0, min(1, (t - sheet_at - .5) / .15, (end - .3 - t) / .15)):.3f};e.style.transform='scale(1)'}})();")
            st['keep'] = True
        return st
    return base.URL, base.DURATION, getattr(base, 'CSS', ''), getattr(base, 'PRE_JS', None), getattr(base, 'INIT_JS', '') + ';' + init_js(html, antes), step
