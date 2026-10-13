import numpy as np, wave, sys, json
SR=44100; N=int(15*SR); out=np.zeros(N); rng=np.random.default_rng(5)
cfg=json.loads(sys.argv[2])
def add(sig,t,g=1.0):
  i=int(t*SR); j=min(N,i+len(sig)); out[i:j]+=g*sig[:j-i]
def env(n,a=0.003,d=0.1):
  t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t/d)
def kick():
  n=int(.35*SR);t=np.arange(n)/SR; f=50+90*np.exp(-t*30); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*7)
def hat():
  n=int(.05*SR); s=np.diff(rng.standard_normal(n),prepend=0); return s*env(n,.001,.012)
def tap():
  n=int(.06*SR);t=np.arange(n)/SR; return (np.sin(2*np.pi*2400*t)*.5+rng.standard_normal(n)*.3)*env(n,.0005,.008)
def chime():
  n=int(.9*SR);t=np.arange(n)/SR; s=0
  for k,f in enumerate([1046.5,1318.5,1568]): s=s+np.sin(2*np.pi*f*t)*np.exp(-t*4)*(t>k*.07)
  return s*.35
def whoosh(d=.5):
  n=int(d*SR); s=rng.standard_normal(n); k=np.linspace(0,1,n); s=np.convolve(s,np.ones(30)/30,'same'); return s*np.sin(np.pi*k)**2*2
def key():
  n=int(.04*SR); t=np.arange(n)/SR; return (rng.standard_normal(n)*.5+np.sin(2*np.pi*1800*t)*.3)*env(n,.0005,.006)
for b in np.arange(cfg.get('beat_from',0),12.5,0.5): add(kick(),b,.9)
for b in np.arange(cfg.get('beat_from',0)+.25,12.5,0.5): add(hat(),b,.35)
for t in cfg.get('whoosh',[]): add(whoosh(.55),t,.45)
for t in cfg.get('tap',[]): add(tap(),t,.6)
for t in cfg.get('keys',[]): add(key(),t,.35)
for t in cfg.get('chime',[]): add(chime(),t,.8)
for t in cfg.get('glitch',[]):
  for k in range(9): add(rng.standard_normal(int(.03*SR))*.6,t+k*.045)
  add(whoosh(.4),t-.05,.4)
add(whoosh(.5),12.1,.6); add(kick(),12.5,1.2)
for b in np.arange(13.0,15,0.5): add(kick(),b,.5)
out=out/np.max(np.abs(out))*0.8
fade=np.ones(N); fade[-int(.6*SR):]=np.linspace(1,0,int(.6*SR)); out*=fade
w=wave.open(sys.argv[1],'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype(np.int16).tobytes()); w.close()
