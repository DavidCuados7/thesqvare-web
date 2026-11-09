# TheSqvare Bar (web rehecha): portada, carta con fotos, reserva de mesa. Ventanas: 0,15–2,3 · 2,3–4,9 · 4,9–7,5 · 7,5–9,9 · 9,9–12,5
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import webspec as W
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'file://' + os.path.join(REPO, 'thesqvare-bar', 'index.html')
DURATION = 12.5
CSS = W.CSS
PRE_JS = W.pre_js(['20:00','20:30','21:00','21:30','22:00','22:30'], {'ok':True,'hora':'21:00','id':'SQ-3907','email':True})
INIT_JS = W.INIT_JS
DIA = '#dias .dia[data-f="2026-11-21"]'
SCROLL = [(0,'0',0),(2.2,'0',0),(2.9,'#carta',-70),(3.6,'#carta',-70),(4.6,'#carta',380),(5.4,'#pax',-200),(7.4,'#pax',-200),(7.8,'#fName',-260),(9.95,'#fName',-260),(10.4,'#resumen',-170)]
TAPS = [(5.65,'#pax [data-p="4"]'),(6.3,DIA),(7.05,'#slots [data-h="21:00"]'),(7.95,'#fName'),(8.5,'#fTel'),(9.0,'#fMail'),(9.45,'#fOk'),(9.8,'#fBtn')]
EVENTS = {
 6.05: f"(()=>{{const d=document.querySelector('{DIA}'),p=d.parentElement,r=d.getBoundingClientRect(),q=p.getBoundingClientRect();p.scrollLeft+=r.left-q.left-(q.width-r.width)/2;}})();",
 5.7: "document.querySelector('#pax [data-p=\"4\"]').click();",
 6.35: f"document.querySelector('{DIA}').click();",
 7.1: "(()=>{const b=document.querySelector('#slots [data-h=\"21:00\"]');if(b)b.click();})();",
 9.5: "(()=>{const c=document.querySelector('#fOk');c.checked=true;c.dispatchEvent(new Event('change'));})();",
 9.85: "document.activeElement&&document.activeElement.blur();document.querySelector('#form').requestSubmit();",
}
TYPING = [(8.0,'#fName','Laura',.4),(8.55,'#fTel','634 218 905',.4),(9.05,'#fMail','laura@gmail.com',.35)]
step = W.make_step(SCROLL, TAPS, EVENTS, TYPING)
