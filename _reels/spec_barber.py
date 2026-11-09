# TheSqvare Barber (web rehecha): portada, servicios, reserva completa. Ventanas: 0,15–2,3 · 2,3–4,6 · 4,6–7,5 · 7,5–9,9 · 9,9–12,5
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import webspec as W
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'file://' + os.path.join(REPO, 'thesqvare-barber', 'index.html')
DURATION = 12.5
CSS = W.CSS
PRE_JS = W.pre_js(['16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30'], {'ok':True,'hora':'17:30','fin':'18:00','precio':16,'id':'SQ-4821','email':True})
INIT_JS = W.INIT_JS
DIA = '#dias .dia[data-f="2026-11-20"]'
SCROLL = [(0,'0',0),(2.2,'0',0),(2.9,'#servicios',-70),(4.4,'#servicios',560),(5.3,'#fSvc',-190),(7.4,'#fSvc',-190),(7.8,'#fName',-260),(9.95,'#fName',-260),(10.4,'#resumen',-170)]
TAPS = [(5.6,'#fSvc'),(6.3,DIA),(7.05,'#slots [data-h="17:30"]'),(7.95,'#fName'),(8.5,'#fTel'),(9.0,'#fMail'),(9.45,'#fOk'),(9.8,'#fBtn')]
EVENTS = {
 6.05: f"(()=>{{const d=document.querySelector('{DIA}'),p=d.parentElement,r=d.getBoundingClientRect(),q=p.getBoundingClientRect();p.scrollLeft+=r.left-q.left-(q.width-r.width)/2;}})();",
 5.65: "(()=>{const s=document.querySelector('#fSvc');s.value='Corte + barba';s.dispatchEvent(new Event('change'));})();",
 6.35: f"document.querySelector('{DIA}').click();",
 7.1: "(()=>{const b=document.querySelector('#slots [data-h=\"17:30\"]');if(b)b.click();})();",
 9.5: "(()=>{const c=document.querySelector('#fOk');c.checked=true;c.dispatchEvent(new Event('change'));})();",
 9.85: "document.activeElement&&document.activeElement.blur();document.querySelector('#form').requestSubmit();",
}
TYPING = [(8.0,'#fName','Carlos',.4),(8.55,'#fTel','612 345 678',.4),(9.05,'#fMail','carlos@gmail.com',.35)]
step = W.make_step(SCROLL, TAPS, EVENTS, TYPING)
