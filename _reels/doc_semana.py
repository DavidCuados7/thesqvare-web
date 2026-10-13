"""Genera el documento semanal de Drive (HTML en base64) a partir de los posts de Metricool y los guiones del narrador.
Uso: python3 _reels/doc_semana.py posts.json _reels/guiones/LUNES.json "Título" "Subtítulo" salida.b64
- posts.json: la lista "data" que devuelve getScheduledPosts (sirve tal cual).
- guiones: lista de {"fecha","formato","guion"} (uno por reel, en orden). Puede no existir.
Después: create_file en Drive con contentMimeType text/html y base64Content = el contenido de salida.b64."""
import sys, json, html, base64, datetime, os
posts, gfile, title, sub, out = sys.argv[1:6]
P=json.load(open(posts)); P=P.get('data',P) if isinstance(P,dict) else P
G=json.load(open(gfile)) if os.path.exists(gfile) else []
GF={g['fecha']:g.get('formato') for g in G}
e=html.escape; DIAS=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']; MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
def info(p):
    dt=datetime.datetime.fromisoformat(p['publicationDate']['dateTime']); typ=(p.get('instagramData') or {}).get('type','POST'); m=p.get('media') or []
    pub=any(x.get('status')=='PUBLISHED' for x in p.get('providers',[]))
    if typ in('REEL','TRIAL_REEL'): f=GF.get(dt.date().isoformat()) or 'Reel'
    elif typ=='STORY': f='Historia'
    else: f=f'Carrusel de {len(m)}' if len(m)>1 else 'Post'
    if pub: f+=' · publicada' if typ=='STORY' else ' · publicado'
    return dt,f"{DIAS[dt.weekday()]} {dt.day} {MES[dt.month-1]}",dt.strftime('%H:%M'),f,p.get('text') or '',m
items=sorted((info(p) for p in P),key=lambda x:x[0])
o=['<!DOCTYPE html><html><head><meta charset="utf-8"><title>x</title></head><body>',f'<h1>{e(title)}</h1>',f'<p>{e(sub)}</p>',
   '<table border="1" cellpadding="6" style="border-collapse:collapse"><tr><th>Día y hora</th><th>Formato</th><th>Tema</th></tr>']
for dt,dl,h,f,t,m in items: o.append(f'<tr><td>{e(dl)}, {h}</td><td>{e(f)}</td><td>{e(t.split(chr(10))[0]) if t else "Historia"}</td></tr>')
o.append('</table>')
if G:
    o.append('<h2>🎙️ Guiones para el narrador</h2><p>Pega cada bloque como un texto distinto en CapCut, en este orden, aplica Texto a voz y exporta un solo archivo con todos seguidos. Pásaselo a Claude y él pone la voz a cada reel.</p>')
    for i,g in enumerate(G,1):
        d=datetime.date.fromisoformat(g['fecha'])
        o.append(f'<p><b>{i} · {DIAS[d.weekday()]} {d.day} · {e(g.get("formato") or "Reel")}</b><br>{e(g["guion"])}</p>')
for dt,dl,h,f,t,m in items:
    o.append(f'<h2>{e(dl)}, {h} — {e(f)}</h2><p>'+(e(t).replace('\n','<br>') if t else '(Historia sin texto)')+'</p>')
    if m and m[0].endswith('.mp4'): o.append(f'<p><a href="{m[0]}">▶ Ver el reel</a></p>')
    elif m:
        w=240 if len(m)==1 else 150; o.append('<p>'+' '.join(f'<img src="{x}" width="{w}">' for x in m)+'</p>')
o.append('</body></html>'); open(out,'wb').write(base64.b64encode('\n'.join(o).encode()))
print('ok',len(items),'posts,',len(G),'guiones')
