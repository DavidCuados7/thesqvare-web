import os
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'file://' + os.path.join(os.path.dirname(os.path.abspath(__file__)), 'demo-horno.html')
DURATION = 12.5
# La página demo-horno.html se anima sola con render(t): web antigua (0-1.6 s), glitch, se construye (2-7 s),
# baja hasta el formulario (7.5-9 s), toca sábado / 9:30 / confirmar (9.2-10.5 s) y sale el aviso (10.8 s).
def step(t):
    return {'js': f'render({t:.4f});', 'keep': True}
