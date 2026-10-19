import re, json, colorsys, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from i18n import T

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = {
  "index.html":                  dict(dark=True,  cta="index", reveal=False, hero=False, body_fade=False, anchor=None),
  "thesqvare-bar/index.html":    dict(dark=True,  cta="reserva", reveal=True, hero=True, body_fade=True, anchor="#reserva"),
  "thesqvare-barber/index.html": dict(dark=True,  cta="reserva", reveal=True, hero=True, body_fade=True, anchor="#reserva"),
  "raco-de-piscis/index.html":   dict(dark=False, cta="reserva", reveal=True, hero=True, body_fade=True, anchor="#reservar"),
  "raco-de-piscis-basica/index.html": dict(dark=False, cta="reserva", reveal=True, hero=True, body_fade=True, anchor="#reservar"),
  "barber-prince/index.html":    dict(dark=True,  cta="reserva", reveal=True, hero=True, body_fade=True, anchor="#reserva"),
}
ICON = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect x=%223%22 y=%223%22 width=%2222%22 height=%2222%22 fill=%22none%22 stroke=%22%232A35F0%22 stroke-width=%224%22/%3E%3Crect x=%2218%22 y=%2218%22 width=%2212%22 height=%2212%22 fill=%22%23FFC83D%22/%3E%3C/svg%3E"

def flip_hex(m):
    h = m.group(0)[1:]
    if len(h) == 3: h = "".join(c*2 for c in h)
    r, g, b = (int(h[i:i+2], 16)/255 for i in (0, 2, 4))
    hh, l, s = colorsys.rgb_to_hls(r, g, b)
    if s < 0.22 or l < 0.12 or l > 0.88: l = 1 - l
    r, g, b = colorsys.hls_to_rgb(hh, l, s)
    return "#%02X%02X%02X" % tuple(round(x*255) for x in (r, g, b))

RGBA = re.compile(r"rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)")
def flip_rgba(m):
    r, g, b = (int(m.group(i))/255 for i in (1, 2, 3))
    hh, l, s = colorsys.rgb_to_hls(r, g, b)
    if s < 0.22 or l < 0.12 or l > 0.88: l = 1 - l
    r, g, b = colorsys.hls_to_rgb(hh, l, s)
    return "rgba(%d,%d,%d,%s)" % (round(r*255), round(g*255), round(b*255), m.group(4))

def split_dark_media(css):
    """Devuelve (css sin bloques @media (prefers-color-scheme: dark), contenido de esos bloques)."""
    out, dark, i = [], [], 0
    pat = re.compile(r"@media\s*\(prefers-color-scheme:\s*dark\)\s*\{")
    while True:
        m = pat.search(css, i)
        if not m:
            out.append(css[i:]); break
        out.append(css[i:m.start()])
        j, depth = m.end(), 1
        while depth and j < len(css):
            if css[j] == "{": depth += 1
            elif css[j] == "}": depth -= 1
            j += 1
        dark.append(css[m.end():j-1])
        i = j
    return "".join(out), "\n".join(dark)

PAGE_EXTRA = {'raco-de-piscis/index.html': ':root{--arena:#2A261E}', 'raco-de-piscis-basica/index.html': ':root{--arena:#2A261E}'}
CURRENT = ''

def alt_css(html):
    css = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", html, re.S))
    css = re.sub(r"url\((['\"]?)data:[^)]*\)", "url()", css)  # no duplicar fuentes/imágenes embebidas
    base, dark = split_dark_media(css)
    flipped = re.sub(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b", flip_hex, base)
    flipped = RGBA.sub(flip_rgba, flipped)
    extra = PAGE_EXTRA.get(CURRENT, "")
    return flipped + ("\n" + dark if dark.strip() else "") + "\n" + extra

KIT_CSS = """
html{scroll-behavior:smooth}
html.sq-js .sq-rv{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .7s ease}
html.sq-js .sq-rv.sq-in{opacity:1;transform:none}
html.sq-js .sq-hero{animation:sqUp .9s cubic-bezier(.2,.7,.2,1) both}
@keyframes sqUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
html.sq-js body.sq-fade{animation:sqFade .5s ease both}
@keyframes sqFade{from{opacity:0}to{opacity:1}}
a,button,input[type=submit],.sq-fab,.sq-panel button,.sq-panel a{transition:transform .2s ease,background-color .2s ease,color .2s ease,box-shadow .2s ease,opacity .2s ease}
a[class*="btn"]:hover,a[class*="cta"]:hover,button[class*="btn"]:hover,button[class*="cta"]:hover,.sq-cta-btn:hover{transform:translateY(-2px)}
a[class*="btn"]:active,a[class*="cta"]:active,button[class*="btn"]:active,button[class*="cta"]:active,.sq-cta-btn:active{transform:translateY(1px) scale(.98)}
a:hover{opacity:.85}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}.sq-rv{opacity:1!important;transform:none!important}}
.sq-fab{position:fixed;left:10px;bottom:14px;z-index:9999;width:48px;height:48px;border:2px solid #F3F4FA;background:#0C0E1A;color:#F3F4FA;box-shadow:3px 3px 0 #2A35F0;font:800 20px/1 system-ui,sans-serif;cursor:pointer;display:grid;place-items:center}
.sq-panel{position:fixed;left:10px;bottom:72px;z-index:9999;display:none;flex-direction:column;gap:8px;align-items:stretch;background:#0C0E1A;padding:10px;border:2px solid #F3F4FA;box-shadow:4px 4px 0 #2A35F0;font:700 13px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif;min-width:150px}
.sq-panel.on{display:flex}
.sq-panel button,.sq-panel select,.sq-panel a{background:#F3F4FA;color:#0C0E1A;border:2px solid #F3F4FA;padding:10px 10px;cursor:pointer;font:inherit;text-decoration:none;text-align:left}
.sq-panel select{padding:9px 8px}
.sq-cta-strip{padding:56px 22px;text-align:center;background:#FFC83D;color:#0C0E1A;border-top:4px solid #0C0E1A}
.sq-cta-strip p{font:800 clamp(22px,4vw,34px)/1.1 Unbounded,system-ui,sans-serif;margin:0 0 18px}
.sq-cta-btn{display:inline-block;background:#0C0E1A;color:#FFC83D;padding:16px 26px;font:800 16px/1 system-ui,sans-serif;text-decoration:none;box-shadow:6px 6px 0 #2A35F0;border:3px solid #0C0E1A}
.sq-modal{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10000;display:none;align-items:center;justify-content:center;padding:18px}
.sq-modal.on{display:flex}
.sq-box{background:#F3F4FA;color:#0C0E1A;width:min(480px,100%);max-height:92vh;overflow:auto;padding:26px 24px;border:4px solid #0C0E1A;box-shadow:10px 10px 0 #2A35F0;position:relative;font:400 16px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
.sq-box h2{font:800 26px/1.05 Unbounded,system-ui,sans-serif;margin:0 0 8px}
.sq-box p{margin:0 0 14px}
.sq-x{position:absolute;right:10px;top:8px;background:none;border:0;font:800 28px/1 system-ui;cursor:pointer;color:#0C0E1A}
.sq-form label{display:block;margin:0 0 12px;font-weight:600;font-size:14px}
.sq-form label span.t{display:block;margin-bottom:6px}
.sq-form input,.sq-form textarea{width:100%;padding:12px;border:2px solid #0C0E1A;background:#fff;color:#0C0E1A;font:400 16px system-ui,sans-serif;border-radius:0}
.sq-form .sq-chk{display:block!important;font-weight:400;font-size:14px;padding-left:0}
.sq-form .sq-chk input{width:auto;display:inline-block;vertical-align:top;margin:3px 10px 0 0}
.sq-form .sq-chk .sq-err{margin-top:6px}
.sq-form input.sq-bad,.sq-form textarea.sq-bad{outline:3px solid #D92D20;outline-offset:0}
.sq-err{display:block;color:#D92D20;font-size:13px;min-height:16px;margin-top:4px;font-weight:600}
.sq-send{width:100%;background:#2A35F0;color:#fff;border:3px solid #0C0E1A;padding:15px;font:800 16px/1 system-ui,sans-serif;cursor:pointer;box-shadow:5px 5px 0 #0C0E1A}
.sq-ok{font-weight:700;color:#0B6B3A;min-height:20px}
.sq-hp{position:absolute;left:-9999px}
"""

KT = {
 "es": {"dark":"Modo oscuro","light":"Modo claro","top":"Volver arriba","cta":"Boceto gratis","ig":"Instagram",
        "cf_t":"Pide tu boceto gratis","cf_s":"Cuéntanos tu negocio y te enseñamos cómo quedaría tu web antes de pagar nada.",
        "f_name":"Nombre","f_biz":"Nombre de tu negocio","f_contact":"Teléfono o correo","f_msg":"¿Qué necesitas? (opcional)",
        "f_priv":"He leído la política de privacidad y acepto que usen mis datos para responderme.","f_send":"Enviar",
        "e_req":"Este campo es obligatorio.","e_min":"Escribe al menos 2 letras.","e_contact":"Escribe un teléfono válido o un correo.","e_priv":"Tienes que aceptar la política de privacidad.",
        "ok":"Gracias. Se abre WhatsApp con tu mensaje; si no se abre, escríbenos a thesqvare@gmail.com.","close":"Cerrar",
        "wa_msg":"Hola, quiero mi boceto gratis.","wa_sub":"Nombre: {n}\nNegocio: {b}\nContacto: {c}\n{m}"},
 "ca": {"dark":"Mode fosc","light":"Mode clar","top":"Tornar amunt","cta":"Esbós gratis","ig":"Instagram",
        "cf_t":"Demana el teu esbós gratis","cf_s":"Explica'ns el teu negoci i et mostrarem com quedaria la teva web abans de pagar res.",
        "f_name":"Nom","f_biz":"Nom del teu negoci","f_contact":"Telèfon o correu","f_msg":"Què necessites? (opcional)",
        "f_priv":"He llegit la política de privacitat i accepto que usin les meves dades per respondre'm.","f_send":"Enviar",
        "e_req":"Aquest camp és obligatori.","e_min":"Escriu almenys 2 lletres.","e_contact":"Escriu un telèfon vàlid o un correu.","e_priv":"Has d'acceptar la política de privacitat.",
        "ok":"Gràcies. S'obre WhatsApp amb el teu missatge; si no s'obre, escriu-nos a thesqvare@gmail.com.","close":"Tancar",
        "wa_msg":"Hola, vull el meu esbós gratis.","wa_sub":"Nom: {n}\nNegoci: {b}\nContacte: {c}\n{m}"},
 "en": {"dark":"Dark mode","light":"Light mode","top":"Back to top","cta":"Free mockup","ig":"Instagram",
        "cf_t":"Get your free mockup","cf_s":"Tell us about your business and we'll show you how your website would look before you pay anything.",
        "f_name":"Name","f_biz":"Business name","f_contact":"Phone or email","f_msg":"What do you need? (optional)",
        "f_priv":"I have read the privacy policy and agree that my data can be used to reply to me.","f_send":"Send",
        "e_req":"This field is required.","e_min":"Please write at least 2 letters.","e_contact":"Enter a valid phone number or email.","e_priv":"You must accept the privacy policy.",
        "ok":"Thanks. WhatsApp will open with your message; if it doesn't, email us at thesqvare@gmail.com.","close":"Close",
        "wa_msg":"Hi, I'd like my free mockup.","wa_sub":"Name: {n}\nBusiness: {b}\nContact: {c}\n{m}"},
}
DICT = {es: {"ca": ca, "en": en} for es, (ca, en) in T.items()}

JS = r"""
(function(){
 var D=__DICT__, K=__KT__, DEF='es';
 function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
 function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
 var lang=get('sq-lang')||DEF, cfg=__CFG__;
 var norm=function(s){return s.replace(/\s+/g,' ').trim()};
 function tr(s,l){var n=norm(s); if(!n||l==='es')return null; var e=D[n]; return e&&e[l]?e[l]:null}
 var ATTR=['placeholder','alt','aria-label','title'];
 function walk(root,fn){var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);var n;while((n=w.nextNode())){var p=n.parentNode;if(!p||/^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.nodeName)||(p.closest&&p.closest('.sq-dock,.sq-modal')))continue;fn(n)}}
 function applyLang(l){
   walk(document.body,function(n){
     if(n.__sqEs===undefined)n.__sqEs=n.nodeValue;
     var src=n.__sqEs, lead=src.match(/^\s*/)[0], trail=src.match(/\s*$/)[0];
     var t=tr(src,l); n.nodeValue=t?lead+t+trail:src;
   });
   document.querySelectorAll('[placeholder],[alt],[aria-label],[title]').forEach(function(el){
     if(el.closest('.sq-dock,.sq-modal'))return;
     ATTR.forEach(function(a){var v=el.getAttribute(a); if(!v)return; var k='__sq_'+a; if(!el[k])el[k]=v; var t=tr(el[k],l); el.setAttribute(a,t||el[k]);});
   });
   document.documentElement.lang=l;
   var s=document.getElementById('sq-lang'); if(s)s.value=l;
   document.querySelectorAll('[data-kt]').forEach(function(el){el.textContent=K[l][el.getAttribute('data-kt')]||el.textContent});
   lang=l; set('sq-lang',l); refreshLabels();
 }
 var alt=document.getElementById('sq-alt');
 var dark=!!cfg.dark; // tema base de la página
 function isAltOn(){return alt&&!alt.disabled}
 function setTheme(){ var saved=get('sq-theme'); if(saved) { alt.disabled = (saved==='base')?true:false; }
   // 'base' = tema original de la web; 'alt' = el contrario
   if(!saved) alt.disabled=true;
   document.documentElement.classList.toggle('sq-alt', isAltOn());
 }
 function toggleTheme(){ alt.disabled=!alt.disabled; set('sq-theme', alt.disabled?'base':'alt'); document.documentElement.classList.toggle('sq-alt', isAltOn()); refreshLabels(); }
 function refreshLabels(){
   var b=document.getElementById('sq-theme'); if(b){ var nowDark=(dark&&!isAltOn())||(!dark&&isAltOn()); b.textContent = nowDark? K[lang].light : K[lang].dark; }
   var t=document.getElementById('sq-top'); if(t)t.setAttribute('aria-label',K[lang].top);
   var c=document.getElementById('sq-cta'); if(c)c.textContent=K[lang].cta;
 }
 // revelar secciones al hacer scroll + fundido de carga
 document.documentElement.classList.add('sq-js');
 if(cfg.body_fade)document.body.classList.add('sq-fade');
 if(cfg.hero){var h=document.querySelector('h1');if(h)h.classList.add('sq-hero')}
 if(cfg.reveal && 'IntersectionObserver' in window){
   var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('sq-in');io.unobserve(e.target)}})},{threshold:.12});
   document.querySelectorAll('section,.card,.pack,.tarjeta').forEach(function(el){el.classList.add('sq-rv');io.observe(el)});
 }
 // imágenes: carga diferida
 document.querySelectorAll('img:not([loading])').forEach(function(im,i){ if(i>0)im.setAttribute('loading','lazy'); im.setAttribute('decoding','async') });
 // volver arriba
 var top=document.getElementById('sq-top');
 if(top) top.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'})});
 // validación de formularios (mensajes en el idioma elegido)
 function msgFor(el){
   if(el.validity.valueMissing)return K[lang][el.type==='checkbox'?'e_priv':'e_req'];
   if(el.validity.tooShort||el.validity.patternMismatch&&el.name==='nombre')return K[lang].e_min;
   if(el.type==='email'||el.name==='contacto')return K[lang].e_contact;
   return el.validationMessage;
 }
 document.addEventListener('invalid',function(e){
   var el=e.target; el.classList.add('sq-bad'); var box=el.closest('label'); var err=box&&box.querySelector('.sq-err');
   var m=msgFor(el); if(err)err.textContent=m; else el.setCustomValidity(m);
 },true);
 document.addEventListener('input',function(e){var el=e.target; el.setCustomValidity(''); el.classList.remove('sq-bad'); var box=el.closest&&el.closest('label'); var err=box&&box.querySelector('.sq-err'); if(err)err.textContent='';},true);
 // panel de ajustes: tema, idioma, volver arriba, CTA e Instagram
 var dock=document.createElement('div'); dock.className='sq-dock'; dock.id='sq-dock';
 dock.innerHTML='<button type="button" class="sq-fab" id="sq-fab" aria-expanded="false" aria-label="Ajustes">Aa</button><div class="sq-panel" id="sq-panel"><button type="button" id="sq-theme"></button><select id="sq-lang" aria-label="Idioma"><option value="es">Español</option><option value="ca">Català</option><option value="en">English</option></select>'+(cfg.cta==='index'?'<button type="button" id="sq-cta"></button>':'')+(cfg.ig?'<a href="https://www.instagram.com/the.sqvare/" target="_blank" rel="noopener">Instagram</a>':'')+'<button type="button" id="sq-top">↑</button></div>';
 document.body.appendChild(dock);
 var fab=document.getElementById('sq-fab'), panel=document.getElementById('sq-panel'); fab.style.bottom=cfg.fab+'px'; panel.style.bottom=(cfg.fab+58)+'px';
 fab.addEventListener('click',function(){var on=panel.classList.toggle('on');fab.setAttribute('aria-expanded',on)});
 document.getElementById('sq-theme').addEventListener('click',toggleTheme);
 document.getElementById('sq-lang').addEventListener('change',function(e){applyLang(e.target.value)});
 var cb=document.getElementById('sq-cta'); if(cb)cb.addEventListener('click',function(){openModal()});
 // formulario de contacto (solo index)
 var modal=document.getElementById('sq-modal');
 function openModal(){ if(!modal)return; var pn=document.getElementById('sq-panel'); if(pn)pn.classList.remove('on'); modal.classList.add('on'); var f=modal.querySelector('input'); if(f)f.focus(); }
 function closeModal(){ if(modal)modal.classList.remove('on'); }
 if(modal){
   modal.addEventListener('click',function(e){ if(e.target===modal||e.target.hasAttribute('data-close'))closeModal() });
   document.addEventListener('keydown',function(e){ if(e.key==='Escape')closeModal() });
   document.querySelectorAll('[data-open-contact]').forEach(function(el){el.addEventListener('click',function(e){e.preventDefault();openModal()})});
   var form=document.getElementById('sq-form');
   form.addEventListener('submit',function(e){
     e.preventDefault();
     if(form.querySelector('.sq-hp').value){return}
     var ok=form.checkValidity();
     form.querySelectorAll('input,textarea').forEach(function(el){ if(!el.checkValidity()){ el.dispatchEvent(new Event('invalid')) } });
     if(!ok)return;
     var v=function(n){return (form.elements[n]||{}).value||''};
     var msg=K[lang].wa_sub.replace('{n}',v('nombre')).replace('{b}',v('negocio')).replace('{c}',v('contacto')).replace('{m}',v('mensaje')?('Mensaje: '+v('mensaje')):'');
     var url='https://wa.me/34648515835?text='+encodeURIComponent(K[lang].wa_msg+'\n'+msg);
     window.open(url,'_blank','noopener');
     form.querySelector('.sq-ok').textContent=K[lang].ok; form.reset();
   });
 }
 // idioma guardado o predeterminado
 setTheme();
 applyLang(lang);
})();
"""

def page_cfg(path):
    c = PAGES[path]
    return {"dark": c["dark"], "reveal": c["reveal"], "hero": c["hero"], "body_fade": c["body_fade"], "cta": c["cta"], "ig": path == "index.html", "fab": 96 if "raco" in path else 14}

MODAL = """
<div class="sq-modal" id="sq-modal" role="dialog" aria-modal="true" aria-labelledby="sq-mt">
 <div class="sq-box">
  <button type="button" class="sq-x" data-close aria-label="Cerrar">×</button>
  <h2 id="sq-mt" data-kt="cf_t">Pide tu boceto gratis</h2>
  <p data-kt="cf_s">Cuéntanos tu negocio y te enseñamos cómo quedaría tu web antes de pagar nada.</p>
  <form id="sq-form" class="sq-form" novalidate>
   <label><span class="t" data-kt="f_name">Nombre</span><input name="nombre" required minlength="2" autocomplete="name"><small class="sq-err"></small></label>
   <label><span class="t" data-kt="f_biz">Nombre de tu negocio</span><input name="negocio" required minlength="2"><small class="sq-err"></small></label>
   <label><span class="t" data-kt="f_contact">Teléfono o correo</span><input name="contacto" required pattern="(\\+?[0-9][0-9 ]{7,}|[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,})"><small class="sq-err"></small></label>
   <label><span class="t" data-kt="f_msg">¿Qué necesitas? (opcional)</span><textarea name="mensaje" rows="3" maxlength="600"></textarea></label>
   <label class="sq-chk"><input type="checkbox" name="privacidad" required><span data-kt="f_priv">He leído la política de privacidad y acepto que usen mis datos para responderme.</span><small class="sq-err"></small></label>
   <input class="sq-hp" name="web" tabindex="-1" autocomplete="off" aria-hidden="true">
   <p class="sq-ok" role="status"></p>
   <button type="submit" class="sq-send" data-kt="f_send">Enviar</button>
  </form>
 </div>
</div>
"""

def build(path):
    global CURRENT
    CURRENT = path
    full = os.path.join(ROOT, path)
    html = open(full, encoding="utf8").read()
    if 'id="sq-kit"' in html:
        html = re.sub(r'<style id="sq-kit">.*?</style>|<style id="sq-alt">.*?</style>|<script id="sq-js">.*?</script>|<div class="sq-dock".*?</div>|<div class="sq-modal".*?</div>\s*</div>\s*</div>', '', html, flags=re.S)
    c = PAGES[path]
    alt = alt_css(html)
    head_add = f'<style id="sq-kit">{KIT_CSS}</style><style id="sq-alt">{alt}</style>'
    if 'rel="icon"' not in html:
        head_add += f'<link rel="icon" href="{ICON}">'
    html = html.replace("</head>", head_add + "\n</head>", 1)
    # CTA repetida antes del pie (solo webs con pie)
    cta_html = ""
    if c["cta"] == "reserva" and c["anchor"]:
        cta_html = f'<div class="sq-cta-strip sq-rv" id="sq-cta-strip"><p data-kt="cf_t">Pide tu boceto gratis</p><a class="sq-cta-btn" href="{c["anchor"]}">Reservar ↗</a></div>'
    if cta_html and "<footer" in html:
        html = re.sub(r"(<footer)", cta_html + r"\n\1", html, count=1)
    if path == "index.html":
        html = html.replace("</body>", MODAL + "\n</body>", 1)
        html = html.replace('<a class="legal" href="legal/">', '<a class="legal" href="legal/">', 1)
        html = re.sub(r'<a class="cta" href="mailto:[^"]*">Pide tu boceto gratis <span>→</span></a>',
                      '<a class="cta" href="#" data-open-contact>Pide tu boceto gratis <span>→</span></a>', html, count=1)
    script = (JS.replace("__DICT__", json.dumps(DICT, ensure_ascii=False))
                .replace("__KT__", json.dumps(KT, ensure_ascii=False))
                .replace("__CFG__", json.dumps(page_cfg(path))))
    html = html.replace("</body>", f'<script id="sq-js">{script}</script>\n</body>', 1)
    open(full, "w", encoding="utf8").write(html)
    return len(html)

if __name__ == "__main__":
    for p in PAGES:
        print(p, build(p))
