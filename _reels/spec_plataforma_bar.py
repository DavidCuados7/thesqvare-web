import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import overlay
URL, DURATION, CSS, PRE_JS, INIT_JS, step = overlay.build('spec_bar.py', overlay.PLATAFORMA_BAR, antes=False, end=3.0, shift=0.8, sheet_at=1.5)
