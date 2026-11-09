"""Utilidades para grabar TheSqvare Bar / TheSqvare Barber (webs rehechas en nov. 2026).
Las posiciones se calculan en el navegador a partir de selectores, así no se rompen si cambia el alto de las secciones."""
import json
FECHA_FALSA = '2026-11-16T10:00:00'   # el reloj de la página: lunes por la mañana
PRE_JS_BASE = ("(()=>{const _D=Date,off=new _D('%s').getTime()-_D.now();"
  "class D extends _D{constructor(...a){a.length?super(...a):super(_D.now()+off)}static now(){return _D.now()+off}};window.Date=D;})();" % FECHA_FALSA)
def pre_js(huecos, post):
    return PRE_JS_BASE + ("window.fetch=(orig=>async(u,o)=>{if(/mock\\.local|script\\.google\\.com/.test(String(u))){"
      "await new Promise(r=>setTimeout(r,60));"
      "if(o&&o.method==='POST')return new Response(JSON.stringify(%s));"
      "return new Response(JSON.stringify({ok:true,huecos:%s}));}return orig(u,o)})(window.fetch);" % (json.dumps(post), json.dumps(huecos)))
CSS = 'html{scroll-behavior:auto!important}#sq-fab,#sq-panel{display:none!important}'
INIT_JS = ("(()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;"
  "while(n=w.nextNode()){if(/Barcelona/.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/\\s*·?\\s*Barcelona/g,'');}"
  "const m=document.getElementById('map');if(m)m.remove();"
  "window.__c=sel=>{const e=document.querySelector(sel);if(!e)return window.__last||[195,500];const r=e.getBoundingClientRect();return window.__last=[r.left+r.width/2,r.top+r.height/2]};"
  "window.__Y=s=>{if(s==='0')return 0;const e=document.querySelector(s);return e?e.getBoundingClientRect().top+scrollY:0};"
  "window.__sc=(a,oa,b,ob,p)=>{const ya=__Y(a)+oa,yb=__Y(b)+ob;scrollTo(0,ya+(yb-ya)*p)};})();")
def ease(x):
    x = max(0, min(1, x)); return 4 * x * x * x if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def make_step(SCROLL, TAPS, EVENTS, TYPING):
    """SCROLL: [(t, selector, offset)], TAPS: [(t, selector)], EVENTS: {t: js}, TYPING: [(t0, sel, texto, dur)]"""
    ev = {round(t * 30): js for t, js in EVENTS.items()}
    def scroll_js(t):
        for (a, sa, oa), (b, sb, ob) in zip(SCROLL, SCROLL[1:]):
            if a <= t <= b:
                p = ease((t - a) / (b - a)) if b > a else 1
                return f"__sc({sa!r},{oa},{sb!r},{ob},{p:.4f});"
        _, s, o = SCROLL[-1]; return f"__sc({s!r},{o},{s!r},{o},1);"
    def step(t):
        f = round(t * 30)
        js = scroll_js(t) + ev.get(f, '')
        for t0, sel, text, dur in TYPING:
            if t0 <= t <= t0 + dur + .05:
                n = int(round(min(1, (t - t0) / dur) * len(text)))
                js += f"(()=>{{const e=document.querySelector('{sel}');e.focus({{preventScroll:true}});e.value={text[:n]!r};}})();"
        for tt, sel in TAPS:
            d = t - tt
            if -.2 <= d <= .35:
                al = max(0, min(1, (d + .2) / .15, (.35 - d) / .2)); sc = 1.15 if d < 0 else 1 - .2 * min(1, d / .15)
                js += f";(()=>{{const c=__c({sel!r});const e=document.getElementById('__touch');e.style.left=c[0]+'px';e.style.top=c[1]+'px';e.style.opacity={al:.3f};e.style.transform='scale({sc:.3f})'}})();"
                return {'js': js, 'keep': True}
        for (a, sa, oa), (b, sb, ob) in zip(SCROLL, SCROLL[1:]):
            if (sa, oa) != (sb, ob) and a - .12 <= t <= b + .08:
                p = ease((t - a) / (b - a)); al = max(0, min(1, (t - a + .12) / .12, (b + .08 - t) / .08))
                return {'js': js, 'touch': (200, 600 - 330 * p, round(al, 3))}
        return {'js': js}
    return step
