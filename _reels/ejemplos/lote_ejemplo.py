import json, subprocess
S=json.load(open('ejemplos/sonidos.json'))
WIN={'web':[(0.15,2.3),(2.3,4.9),(4.9,7.8),(7.8,10.2),(10.2,12.5)],
 'barber':[(.15,2.3),(2.3,4.6),(4.6,7.5),(7.5,9.9),(9.9,12.5)],
 'bar':[(.15,2.3),(2.3,4.9),(4.9,7.5),(7.5,9.9),(9.9,12.5)],
 'antes':[(.15,1.6),(1.6,2.6),(2.6,5.1),(5.1,8.0),(8.0,10.4),(10.4,12.5)],
 'plataforma':[(.15,1.6),(1.6,3.0),(3.0,5.4),(5.4,8.3),(8.3,10.7),(10.7,12.5)]}
NB={'title':'TheSqvare Barber','l1':'¡Cita confirmada! Vie 16 oct · 17:30','l2':'Corte + barba · Código SQ-4821'}
NR={'title':'TheSqvare Bar','l1':'¡Mesa reservada! Vie 16 oct · 21:00','l2':'4 personas · Código SQ-3907'}
def L(a,b):  # a: línea crema, b: línea lima
    return [[[a,0]],[[b,1]]]
R={
 '2026-10-18':('plataforma','barber',[L('Reservar en una app:','eres uno más.'),L('Y antes, que','se registre…'),L('En tu web:','solo existes tú.'),L('Elige y reserva','en segundos.'),L('Sin cuentas,','sin descargas.'),L('Y la confirmación,','al momento.')]),
 '2026-10-19':('web',None,[L('Abierta 24 horas,','sin cerrar nunca.'),L('Carta, reservas','y mapa, en uno.'),L('Ejemplos que','puedes probar.'),L('Precio cerrado,','sin letra pequeña.'),L('Tu boceto,','gratis.')]),
 '2026-10-20':('antes','bar',[L('¿La web de tu bar','sigue así?'),[[['Vale. ',0],['Mira esto.',1]]],L('Tu carta, con','fotos de verdad.'),L('Reserva de mesa','en segundos.'),L('Ni apps,','ni registros.'),L('Mesa reservada','y confirmada.')]),
 '2026-10-21':('barber',None,[L('Citas mientras','cortas el pelo.'),L('Tus precios,','siempre claros.'),L('El cliente elige…','y listo.'),L('Sin coger','el teléfono.'),L('Confirmación','en su correo.')]),
 '2026-10-22':('plataforma','bar',[L('En la app, tu bar','compite con todos.'),L('Y para reservar…','crea una cuenta.'),L('En tu web,','tu bar es el único.'),L('Personas, día','y hora. Listo.'),L('Sin depender de','ninguna plataforma.'),L('Mesa confirmada','al instante.')]),
 '2026-10-23':('web',None,[L('Tu escaparate','en internet.'),L('Pensada primero','para el móvil.'),L('Cada web, con','su propio estilo.'),L('Elige tu pack.','Con o sin reservas.'),L('Escríbeme y','lo vemos juntos.')]),
 '2026-10-24':('antes','barber',[L('¿La web de tu','barbería es así?'),[[['Vale. ',0],['Mira esto.',1]]],L('Tu barbería,','a otro nivel.'),L('Cita en','20 segundos.'),L('Sin descargar','ninguna app.'),L('Y la confirmación,','al momento.')]),
 '2026-10-25':('bar',None,[L('Que reserven mesa','mientras duermes.'),L('Platos que entran','por los ojos.'),L('Personas, día','y hora.'),L('Ni una llamada','en hora punta.'),L('Reserva hecha','y confirmada.')]),
}
def shifted(ev,sh):
    return {k:([round(x+sh,3) for x in v] if isinstance(v,list) else v) for k,v in ev.items()}
for date,(fmt,web,caps) in R.items():
    if fmt in ('web','barber','bar'): frames=f'trabajo/frames_{fmt}'; snd=S[fmt]; notif={'barber':NB,'bar':NR}.get(fmt); win=WIN[fmt]; extra={}
    elif fmt=='antes':
        frames=f'trabajo/frames_antes_{web}'; snd=shifted(S[web],.5); snd.update(glitch=[1.55],beat_from=2.0); win=WIN['antes']
        notif=dict({'barber':NB,'bar':NR}[web],t0=10.95,t1=12.3); extra={'old':True,'old_end':2.0}
    else:
        frames=f'trabajo/frames_plataforma_{web}'; snd=shifted(S[web],.8); snd.update(glitch=[2.55],beat_from=3.0); snd['whoosh']=snd['whoosh']+[1.45]; snd['tap']=[2.0]+snd['tap']; win=WIN['plataforma']
        notif=dict({'barber':NB,'bar':NR}[web],t0=11.25,t1=12.3); extra={'old':True,'old_end':3.0}
    if notif and 't0' not in notif: notif=dict(notif,t0=10.45,t1=12.25)
    cfg=dict(frames=frames,out=f'trabajo/reel_{date}.mp4',sfx=f'trabajo/sonido_{date}.wav',shift=True,caps=[[a,b,c] for (a,b),c in zip(win,caps)],**extra)
    if notif: cfg['notif']=notif
    json.dump(cfg,open(f'trabajo/{date}.json','w'),ensure_ascii=False)
    subprocess.run(['python3','sonido.py',cfg['sfx'],json.dumps(snd)],check=True)
    subprocess.run(['python3','montar.py',f'trabajo/{date}.json'],check=True)
    print(date,fmt,web,flush=True)
