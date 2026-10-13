"""Pone narrador a los reels de una semana a partir de UN audio con todos los guiones seguidos.
Uso: python3 narrador.py AUDIO_O_VIDEO FECHA1 FECHA2 ... (en el mismo orden que los guiones)
Cada guion debe acabar con "Escríbenos por DM." (se usa para encontrar dónde termina cada uno).
Crea ig/FECHA/reel-voz.mp4 junto al reel original (sin tocarlo)."""
import sys, os, subprocess, numpy as np
from scipy.signal import stft
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','ig')
def run(c): subprocess.run(c,check=True)
def dur(f): return float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
src,fechas=sys.argv[1],sys.argv[2:]; n=len(fechas)
run(['ffmpeg','-v','error','-y','-i',src,'-vn','-ac','1','-ar','16000','/tmp/_voz.wav'])
a=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i','/tmp/_voz.wav','-f','s16le','-'],capture_output=True).stdout,np.int16).astype(float)
f,t,Z=stft(a,16000,nperseg=512,noverlap=352); S=np.log(np.abs(Z)[:200]+1e-3); S=S-S.mean(1,keepdims=True)
e=S.mean(0); end=np.where(e>np.percentile(e,30))[0][-1]; L=135
tn=S[:,end-L:end]/np.linalg.norm(S[:,end-L:end])
sc=np.array([(S[:,i:i+L]*tn).sum()/(np.linalg.norm(S[:,i:i+L])+1e-9) for i in range(S.shape[1]-L)])
total=end/100; picks=[end-L]
for k in range(1,n):  # el "Escríbenos por DM" más parecido cerca de donde debería acabar cada guion
    exp=int(total*k/n*100); lo,hi=max(0,exp-400),min(len(sc),exp+400); picks.append(lo+int(np.argmax(sc[lo:hi])))
ends=sorted((p+L)/100 for p in picks); print('finales:',ends)
for k,d in enumerate(fechas):
    s=0 if k==0 else ends[k-1]+0.05
    run(['ffmpeg','-v','error','-y','-ss',str(s),'-to',str(ends[k]+0.2),'-i','/tmp/_voz.wav','-af','silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-15:TP=-1.5:LRA=11','-ar','44100','/tmp/_seg.wav'])
    tempo=max(1.0,dur('/tmp/_seg.wav')/14.4)
    run(['ffmpeg','-v','error','-y','-i','/tmp/_seg.wav','-af',f'atempo={tempo:.3f},adelay=250|250','-ar','44100','/tmp/_nar.wav'])
    dd=os.path.join(R,d); v=[x for x in os.listdir(dd) if x.endswith('.mp4') and 'voz' not in x][0]
    run(['ffmpeg','-v','error','-y','-i',os.path.join(dd,v),'-i','/tmp/_nar.wav','-filter_complex','[0:a]volume=0.32[bg];[bg][1:a]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]','-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',os.path.join(dd,'reel-voz.mp4')])
    print(d,'ok, tempo',round(tempo,3))
