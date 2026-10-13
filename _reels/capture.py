"""Graba una web en viewport móvil a 30 fps con el tiempo de las animaciones CSS ralentizado (render sin tirones).
Uso: python3 capture.py <script.py> <out_dir>
El script define URL, DURATION, CSS (opcional), INIT_JS (opcional) y step(t) -> dict(js=..., touch=(x,y,alpha)|None, scale)."""
import asyncio, sys, os, time, importlib.util
from playwright.async_api import async_playwright
RATE = 0.1
TOUCH = """(()=>{const d=document.createElement('div');d.id='__touch';d.style.cssText='position:fixed;left:0;top:0;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:rgba(255,255,255,.5);border:2px solid rgba(255,255,255,.95);box-shadow:0 0 0 1px rgba(0,0,0,.25),0 4px 14px rgba(0,0,0,.25);z-index:2147483647;pointer-events:none;opacity:0';document.body.appendChild(d)})()"""
async def main(spec, out):
    os.makedirs(out, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--lang=es-ES'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='es-ES')
        if getattr(spec, 'PRE_JS', None): await pg.add_init_script(spec.PRE_JS)
        await pg.goto(spec.URL); await pg.wait_for_timeout(800)
        if getattr(spec, 'CSS', None): await pg.add_style_tag(content=spec.CSS)
        await pg.evaluate(TOUCH)
        if getattr(spec, 'INIT_JS', None): await pg.evaluate(spec.INIT_JS)
        await pg.wait_for_timeout(600)
        cdp = await pg.context.new_cdp_session(pg)
        await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', {'playbackRate': RATE})
        N = int(spec.DURATION * 30); t0 = time.time()
        for f in range(N):
            t = f / 30
            st = spec.step(t)
            js = st.get('js', '')
            tc = st.get('touch')
            if tc: js += f";(()=>{{const d=document.getElementById('__touch');d.style.left='{tc[0]}px';d.style.top='{tc[1]}px';d.style.opacity={tc[2]};d.style.transform='scale({tc[3] if len(tc)>3 else 1})'}})()"
            elif not st.get('keep'): js += ";document.getElementById('__touch').style.opacity=0"
            await pg.evaluate(js)
            await pg.screenshot(path=f'{out}/f_{f:04d}.jpg', type='jpeg', quality=92)
            wait = t0 + (f + 1) / 30 / RATE - time.time()
            if wait > 0: await asyncio.sleep(wait)
        await b.close()
spec_path, out = sys.argv[1], sys.argv[2]
sp = importlib.util.spec_from_file_location('spec', spec_path); spec = importlib.util.module_from_spec(sp); sp.loader.exec_module(spec)
asyncio.run(main(spec, out))
