# Reel de la portada nueva (simulación épica): 5 capítulos con swipes verticales.
import os
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'file://' + os.path.join(REPO, 'index.html')
DURATION = 12.5
CSS = ''
INIT_JS = ''
def ease(x):
    x = max(0, min(1, x)); return 4 * x * x * x if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
# (inicio, fin, capítulo de origen, capítulo de destino) -> progreso p = capítulo/5
SW = [(2.0, 2.6, 0.0, 0.2), (4.8, 5.4, 0.2, 0.6), (7.9, 8.5, 0.6, 0.8), (10.3, 10.9, 0.8, 1.0)]
def step(t):
    p = 0.0
    touch = None
    for a, b, p0, p1 in SW:
        if t >= a: p = p0 + (p1 - p0) * ease((t - a) / (b - a))
        if a - .15 <= t <= b + .1:
            k = ease((t - a) / (b - a))
            al = min(1, (t - a + .15) / .15, (b + .1 - t) / .1)
            touch = (205, 640 - 380 * k, round(max(0, al), 3))
    js = f'window.__go({p:.4f});'
    return {'js': js, 'touch': touch}
