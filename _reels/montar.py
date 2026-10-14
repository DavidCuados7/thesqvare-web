import os, sys, math, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
D = os.getcwd()  # rutas relativas a la carpeta desde la que se ejecuta
FPS, W, H = 30, 1080, 1920
PHONE_END, TOTAL = 12.5, 15.0
FD = '/usr/share/fonts/opentype/inter/'
F = lambda n, s: ImageFont.truetype(FD + n, s)
BG, CREAM, LIME = (15, 15, 16), (244, 241, 234), (200, 242, 90)
import json
CFG = json.load(open(sys.argv[1]))
FR = D + '/' + CFG['frames']
shots = sorted(f for f in os.listdir(FR) if f.endswith('.jpg'))

# ---------- phone geometry ----------
SC = 0.8
SW, SH = int(780 * SC), int(1688 * SC)       # screen
BZ = 20
PW, PH = SW + 2 * BZ, SH + 2 * BZ
PX, PY = (W - PW) // 2, 430
def rr_mask(size, r):
    m = Image.new('L', size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], r, fill=255); return m
SCREEN_MASK = rr_mask((SW, SH), 58)
body = Image.new('RGBA', (PW, PH), (0, 0, 0, 0))
d = ImageDraw.Draw(body)
d.rounded_rectangle([0, 0, PW - 1, PH - 1], 76, fill=(22, 22, 24, 255), outline=(70, 70, 76, 255), width=3)
d.rounded_rectangle([6, 6, PW - 7, PH - 7], 72, outline=(38, 38, 42, 255), width=2)
island = Image.new('RGBA', (PW, PH), (0, 0, 0, 0))
ImageDraw.Draw(island).rounded_rectangle([PW // 2 - 78, BZ + 14, PW // 2 + 78, BZ + 56], 21, fill=(0, 0, 0, 255))
# glow + shadow
glow = Image.new('L', (W, H), 0)
ImageDraw.Draw(glow).ellipse([PX - 120, PY + 200, PX + PW + 120, PY + PH - 100], fill=110)
glow = glow.filter(ImageFilter.GaussianBlur(140))
BASE = Image.new('RGB', (W, H), BG)
BASE.paste(Image.new('RGB', (W, H), (60, 80, 20)), (0, 0), glow)

def statusbar(img, t):
    dr = ImageDraw.Draw(img)
    band = int(48 * 2 * SC)
    dr.rectangle([0, 0, SW, band], fill=img.getpixel((SW // 2, band + 3)) if (t >= CFG.get('old_end', 2.0) or not CFG.get('old')) else (255, 255, 255))
    bgc = img.getpixel((SW // 2, band + 3)) if (t >= CFG.get('old_end', 2.0) or not CFG.get('old')) else (255, 255, 255)
    ink = (20, 20, 20) if sum(bgc) > 380 else (245, 245, 245)
    dr.text((52, 28), '9:41', font=F('Inter-SemiBold.otf', 25), fill=ink)
    x = SW - 160
    for i, h in enumerate([10, 14, 18, 22]):
        dr.rounded_rectangle([x + i * 9, 54 - h, x + i * 9 + 6, 54], 2, fill=ink)
    dr.rounded_rectangle([SW - 100, 33, SW - 52, 55], 6, outline=ink, width=2)
    dr.rounded_rectangle([SW - 96, 37, SW - 66, 51], 3, fill=ink)

def notif(scr, t, n):
    t0, t1 = n['t0'], n['t1']
    if t < t0 or t > t1 + .4: return
    p = min(1, (t - t0) / .35); p = 1 - (1 - p) ** 3
    q = 1 - min(1, max(0, (t - t1) / .35)); q = q * q
    bw, bh = SW - 28, 150
    y = int(-bh + (bh + 64) * p * q + 0) if t > t1 else int(-bh + (bh + 64) * p)
    x = 14
    if y + bh <= 0: return
    y0c = max(0, y); region = scr.crop((x, y0c, x + bw, y + bh)).filter(ImageFilter.GaussianBlur(18))
    tile = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
    glass = Image.new('RGBA', (bw, bh), (238, 238, 242, 228))
    base = Image.new('RGBA', (bw, bh), (0, 0, 0, 0)); base.paste(region.convert('RGBA'), (0, y0c - y))
    tile = Image.alpha_composite(base, glass)
    d = ImageDraw.Draw(tile)
    # icono sobre
    d.rounded_rectangle([20, 26, 84, 90], 15, fill=(37, 99, 235))
    d.rectangle([32, 42, 72, 74], fill=(255, 255, 255)); d.line([(32, 42), (52, 60), (72, 42)], fill=(37, 99, 235), width=3)
    d.text((102, 22), 'CORREO', font=F('Inter-SemiBold.otf', 19), fill=(110, 110, 118))
    d.text((bw - 22, 22), 'ahora', font=F('Inter-Medium.otf', 19), fill=(110, 110, 118), anchor='ra')
    d.text((102, 50), n['title'], font=F('Inter-Bold.otf', 25), fill=(15, 15, 18))
    d.text((102, 84), n['l1'], font=F('Inter-Medium.otf', 22), fill=(30, 30, 34))
    d.text((102, 112), n['l2'], font=F('Inter-Regular.otf', 21), fill=(70, 70, 78))
    m = rr_mask((bw, bh), 34)
    sh = Image.new('L', scr.size, 0); ImageDraw.Draw(sh).rounded_rectangle([x + 6, y + 14, x + bw - 6, y + bh + 12], 34, fill=90)
    scr.paste((0, 0, 0), (0, 0), sh.filter(ImageFilter.GaussianBlur(14)))
    scr.paste(tile.convert('RGB'), (x, y), m)

def phone_layer(t, zoom):
    i = min(len(shots) - 1, int(round(t * FPS)))
    scr = Image.open(FR + '/' + shots[i]).convert('RGB').resize((SW, SH), Image.LANCZOS)
    if CFG.get('shift'):
        band = int(48 * 2 * SC); can = Image.new('RGB', (SW, SH), scr.getpixel((SW // 2, 3))); can.paste(scr, (0, band)); scr = can
    if t < 1.95:   # old site: white status bar
        pass
    statusbar(scr, t)
    if CFG.get('notif'): notif(scr, t, CFG['notif'])
    ph = body.copy()
    ph.paste(scr, (BZ, BZ), SCREEN_MASK)
    ph.alpha_composite(island)
    if zoom != 1:
        ph = ph.resize((int(PW * zoom), int(PH * zoom)), Image.LANCZOS)
    return ph

# ---------- captions ----------
CAPS = [(c[0], c[1], [[(tx, LIME if hl else CREAM) for tx, hl in ln] for ln in c[2]]) for c in CFG['caps']]
CF = F('InterDisplay-ExtraBold.otf', 76)
def draw_caption(img, t):
    for s, e, lines in CAPS:
        if s <= t < e:
            p = min(1, (t - s) / 0.22); p = 1 - (1 - p) ** 3
            out = 1 - min(1, max(0, (t - (e - 0.12)) / 0.12)) if e != PHONE_END else 1
            a = int(255 * p * out)
            layer = Image.new('RGBA', (W, 400), (0, 0, 0, 0)); dl = ImageDraw.Draw(layer)
            y = 40 if len(lines) == 2 else 90
            for ln in lines:
                tw = sum(dl.textlength(tx, font=CF) for tx, _ in ln); x = (W - tw) / 2
                for tx, col in ln:
                    dl.text((x, y), tx, font=CF, fill=col + (a,)); x += dl.textlength(tx, font=CF)
                y += 92
            img.paste(layer, (0, int(120 + (1 - p) * 30)), layer)

def rgb_split(img, k):
    r, g, b = img.split()
    r = ImageChops.offset(r, int(k), 0); b = ImageChops.offset(b, -int(k), int(k / 3))
    return Image.merge('RGB', (r, g, b))

# ---------- end card ----------
def end_card(t):
    u = t - PHONE_END
    img = BASE.copy(); dr = ImageDraw.Draw(img)
    def fade(t0, d=0.3): p = min(1, max(0, (u - t0) / d)); return 1 - (1 - p) ** 3
    def txt(xy, s, font, col, p, anchor='mm'):
        if p <= 0: return
        layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(layer).text((xy[0], xy[1] + (1 - p) * 26), s, font=font, fill=col + (int(255 * p),), anchor=anchor)
        img.paste(layer, (0, 0), layer)
    p0 = fade(0)
    sq = int(120 * (0.6 + 0.4 * p0))
    if p0 > 0:
        dr.rounded_rectangle([W / 2 - sq / 2, 470 - sq / 2, W / 2 + sq / 2, 470 + sq / 2], 10, fill=LIME)
    txt((W / 2, 610), 'THE SQVARE', F('Inter-ExtraBold.otf', 64), CREAM, fade(0.1))
    txt((W / 2, 800), 'Tu web, lista', F('InterDisplay-ExtraBold.otf', 104), CREAM, fade(0.35))
    txt((W / 2, 915), 'para vender.', F('InterDisplay-ExtraBold.otf', 104), LIME, fade(0.45))
    txt((W / 2, 1060), 'Boceto gratis antes de pagar.', F('Inter-Medium.otf', 40), (200, 196, 188), fade(0.8))
    p = fade(1.1)
    if p > 0:
        layer = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dl = ImageDraw.Draw(layer)
        yy = 1210 + (1 - p) * 26
        dl.rounded_rectangle([W / 2 - 250, yy - 52, W / 2 + 250, yy + 52], 52, fill=LIME + (int(255 * p),))
        dl.text((W / 2, yy), 'Escríbenos por DM', font=F('Inter-Bold.otf', 44), fill=(15, 15, 16, int(255 * p)), anchor='mm')
        img.paste(layer, (0, 0), layer)
    return img

def frame(n):
    t = n / FPS
    if t >= PHONE_END:
        img = end_card(t)
        if t < PHONE_END + 0.12: img = rgb_split(img, 18 * (1 - (t - PHONE_END) / 0.12))
        return img
    img = BASE.copy()
    zoom = 1.0 + 0.035 * min(1, t / PHONE_END)
    ph = phone_layer(t, zoom)
    x = (W - ph.width) // 2; y = PY - (ph.height - PH) // 3
    # shadow
    sh = Image.new('L', (W, H), 0)
    ImageDraw.Draw(sh).rounded_rectangle([x + 10, y + 40, x + ph.width - 10, y + ph.height + 30], 80, fill=170)
    img.paste((0, 0, 0), (0, 0), sh.filter(ImageFilter.GaussianBlur(40)))
    img.paste(ph, (x, y), ph)
    draw_caption(img, t)
    OE = CFG.get('old_end', 2.0)
    if CFG.get('old') and OE - .45 <= t < OE + .05:  # glitch
        k = 22 * math.sin((t - (OE - .45)) / 0.5 * math.pi)
        img = rgb_split(img, k)
        if int(t * 60) % 2 == 0:
            a = np.asarray(img).copy(); yy = int((t * 997) % 1500) + 200
            a[yy:yy + 60] = np.roll(a[yy:yy + 60], 40, axis=1); img = Image.fromarray(a)
    if t >= PHONE_END - 0.15:  # flash out
        img = Image.blend(img, Image.new('RGB', (W, H), BG), (t - (PHONE_END - 0.15)) / 0.15)
    return img

if __name__ == '__main__':
    if len(sys.argv) > 2:   # preview frames
        for tt in sys.argv[2].split(','):
            frame(int(float(tt) * FPS)).save(f"{D}/prev_{CFG['out']}_{tt}.jpg", quality=90)
        sys.exit()
    N = int(TOTAL * FPS)
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-i', D + '/' + CFG['sfx'], '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
                           '-shortest', '-movflags', '+faststart', D + '/' + CFG['out']], stdin=subprocess.PIPE)
    for n in range(N):
        ff.stdin.write(frame(n).tobytes())
    ff.stdin.close(); ff.wait(); print('done', ff.returncode)
