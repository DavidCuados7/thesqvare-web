import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import overlay
URL, DURATION, CSS, PRE_JS, INIT_JS, step = overlay.build('spec_barber.py', overlay.ANTES_BARBER, antes=True, end=2.0, shift=0.5, sheet_at=None)
