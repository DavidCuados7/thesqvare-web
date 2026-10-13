import os
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'file://' + os.path.join(REPO, 'thesqvare-bar', 'index.html')
DURATION = 12.5
CSS = 'html{scroll-behavior:auto!important}'
PRE_JS = """window.fetch=(orig=>async(u,o)=>{if(/mock\.local|script\.google\.com/.test(String(u))){
 if(o&&o.method==='POST')return new Response(JSON.stringify({ok:true,hora:'21:00',id:'SQ-3907',email:true}));
 return new Response(JSON.stringify({ok:true,huecos:['20:00','20:30','21:00','21:30','22:00','22:30']}));}
 return orig(u,o)})(window.fetch);"""
INIT_JS = "(()=>{window.__c=sel=>{const e=document.querySelector(sel);if(!e)return window.__last||[195,500];const r=e.getBoundingClientRect();return window.__last=[r.left+r.width/2,r.top+r.height/2]};const d=document.querySelector('#fDay');d.type='text';d.placeholder='dd/mm/aaaa';document.querySelectorAll('img[loading]').forEach(i=>i.loading='eager');})()"

def ease(x):
    x = max(0, min(1, x)); return 4 * x * x * x if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
SCROLL = [(0, 0), (2.0, 0), (2.6, 1180), (4.6, 3300), (5.4, 7798), (7.4, 7798), (7.7, 7918), (9.95, 7918), (10.35, 7738)]
def scroll_y(t):
    for (a, ya), (b, yb) in zip(SCROLL, SCROLL[1:]):
        if a <= t <= b: return ya + (yb - ya) * ease((t - a) / (b - a)) if b > a else yb
    return SCROLL[-1][1]
TAPS = [(5.7, '#fSvc'), (6.4, '#fDay'), (7.2, '#slots button[data-h="21:00"]'), (7.75, '#fName'), (8.45, '#fTel'), (9.05, '#fMail'), (9.75, '#fBtn')]
def typing(t, t0, sel, text, dur):
    if t0 <= t <= t0 + dur + .05:
        n = int(round(min(1, (t - t0) / dur) * len(text)))
        return f"(()=>{{const e=document.querySelector('{sel}');e.focus();e.value={text[:n]!r};}})();"
    return ''
EVENTS = {
    round(5.75 * 30): "(()=>{const s=document.querySelector('#fSvc');const o=[...s.options].find(o=>/^4 personas/.test(o.textContent));s.value=o.value;s.dispatchEvent(new Event('change'));})();",
    round(6.5 * 30): "(()=>{const d=document.querySelector('#fDay');d.type='date';d.value='2026-10-16';d.dispatchEvent(new Event('change'));d.type='text';d.value='vie, 16/10/2026';})();",
    round(7.25 * 30): "document.querySelector('#slots button[data-h=\"21:00\"]').click();",
    round(9.8 * 30): "document.activeElement&&document.activeElement.blur();const d=document.querySelector('#fDay');d.type='date';d.value='2026-10-16';document.querySelector('#form').requestSubmit();",
}
def step(t):
    f = round(t * 30)
    js = f"window.scrollTo(0,{scroll_y(t):.1f});" + EVENTS.get(f, '')
    js += typing(t, 7.85, '#fName', 'Laura', .45) + typing(t, 8.5, '#fTel', '634 218 905', .45) + typing(t, 9.1, '#fMail', 'laura@gmail.com', .5)
    for tt, sel in TAPS:
        d = t - tt
        if -.2 <= d <= .35:
            al = max(0, min(1, (d + .2) / .15, (.35 - d) / .2)); sc = 1.15 if d < 0 else 1 - .2 * min(1, d / .15)
            js += f";(()=>{{const c=__c('{sel}'.replace(/&quot;/g,'\"'));const e=document.getElementById('__touch');e.style.left=c[0]+'px';e.style.top=c[1]+'px';e.style.opacity={al:.3f};e.style.transform='scale({sc:.3f})'}})();"
            return {'js': js, 'keep': True}
    # swipe dot during scrolls
    for (a, ya), (b, yb) in zip(SCROLL, SCROLL[1:]):
        if yb != ya and a - .12 <= t <= b + .08:
            p = ease((t - a) / (b - a)); al = max(0, min(1, (t - a + .12) / .12, (b + .08 - t) / .08))
            sign = 1 if yb > ya else -1
            return {'js': js, 'touch': (200, 600 - sign * 330 * p, round(al, 3))}
    return {'js': js}
