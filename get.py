import json,urllib.request,os,sys
H={'User-Agent':'Mozilla/5.0','Accept':'application/json'}
def j(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=30))
def dl(u,p):
    open(p,'wb').write(urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=60).read())
os.makedirs('fotos',exist_ok=True); meta=[]
seen=set()
def take(ph,grp):
    if ph['id'] in seen or ph.get('premium') or ph.get('plus'): return
    seen.add(ph['id'])
    fn=f"fotos/{grp}_{ph['id']}.jpg"
    try:
        dl(ph['urls']['raw']+'&w=1400&q=78&fm=jpg&fit=max',fn)
        meta.append(dict(id=ph['id'],grp=grp,file=fn,user=ph['user']['name'],alt=ph.get('alt_description'),w=ph['width'],h=ph['height']))
    except Exception as e: print('fail',ph['id'],e)
for line in open('queries.txt'):
    grp,q=line.split()
    try:
        r=j(f"https://unsplash.com/napi/search/photos?query={q}&per_page=14")
        for ph in r['results']: take(ph,grp)
    except Exception as e: print('search fail',q,e)
for pid in open('extra.txt').read().split():
    try: take(j(f"https://unsplash.com/napi/photos/{pid}"),'extra')
    except Exception as e: print('photo fail',pid,e)
json.dump(meta,open('fotos/meta.json','w'),indent=1,ensure_ascii=False)
print(len(meta))
