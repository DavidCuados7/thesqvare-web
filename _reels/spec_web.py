import os
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'file://' + os.path.join(REPO, 'index.html')
DURATION = 12.5
CSS = ('.deck{scroll-snap-type:none!important;scroll-behavior:auto!important}'
       '.packs,.demos{scroll-snap-type:none!important;scroll-behavior:auto!important}')
INIT_JS = """(()=>{
const deck=document.getElementById('deck');
window.__S=[...document.querySelectorAll('.slide')].filter(s=>getComputedStyle(s).display!='none');
window.__go=v=>{const i=Math.floor(v),f=v-i,a=__S[i].offsetTop,b=__S[Math.min(i+1,__S.length-1)].offsetTop;deck.scrollTop=a+(b-a)*f;};
window.__h=(sel,v)=>{const el=document.querySelector(sel),k=[...el.children].filter(c=>c.tagName!=='P');const i=Math.floor(v),f=v-i;const a=k[i].offsetLeft-k[0].offsetLeft,b=k[Math.min(i+1,k.length-1)].offsetLeft-k[0].offsetLeft;el.scrollLeft=a+(b-a)*f;};
window.__cy=sel=>{const r=document.querySelector(sel).getBoundingClientRect();return r.top+r.height/2;};
})()"""
def ease(x):
    x = max(0, min(1, x)); return 4 * x * x * x if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
V = [(2.0, 2.6, 0), (4.8, 5.4, 1), (7.9, 8.5, 2), (10.3, 10.9, 3)]   # vertical swipes slide i -> i+1
HZ = [(6.1, 6.7, '#muestras .demos', 0), (6.9, 7.5, '#muestras .demos', 1), (9.1, 9.7, '#packs .packs', 0)]
def step(t):
    v = 0; touch = None
    for a, b, i in V:
        if t >= a: v = i + ease((t - a) / (b - a))
        if a - .15 <= t <= b + .1:
            p = ease((t - a) / (b - a)); al = min(1, (t - a + .15) / .15, (b + .1 - t) / .1)
            touch = (205, 640 - 380 * p, round(max(0, al), 3))
    js = f'__go({v});'
    hv = {}
    for a, b, sel, i in HZ:
        if t >= a: hv[sel] = i + ease((t - a) / (b - a))
        if a - .15 <= t <= b + .1:
            p = ease((t - a) / (b - a)); al = min(1, (t - a + .15) / .15, (b + .1 - t) / .1)
            touch = ('320-250*' + str(p), f"__cy('{sel}')", round(max(0, al), 3))
    for sel, x in hv.items(): js += f"__h('{sel}',{x});"
    if 11.6 <= t <= 12.2:  # toque en "Escríbeme por Instagram"
        d = t - 11.75; al = max(0, min(1, (t - 11.6) / .15, (12.2 - t) / .2)); sc = 1.15 if d < 0 else 1 - .2 * min(1, d / .15)
        touch = (195, "(()=>{const a=[...document.querySelectorAll('#contacto a')].find(x=>/Instagram/i.test(x.textContent));const r=a.getBoundingClientRect();return r.top+r.height/2})()", round(al, 3), sc)
    if touch and isinstance(touch[0], str) or (touch and isinstance(touch[1], str)):
        x, y = touch[0], touch[1]
        rest = touch[2:]
        js += f";(()=>{{const d=document.getElementById('__touch');d.style.left=({x})+'px';d.style.top=({y})+'px';d.style.opacity={rest[0]};d.style.transform='scale({rest[1] if len(rest)>1 else 1})'}})();"
        return {'js': js, 'touch': None, 'keep': True}
    return {'js': js, 'touch': touch}
