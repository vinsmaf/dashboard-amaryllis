from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os

FONTS = "/Users/vincentsalomon/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/11936945-5b32-40ca-b27d-44942c92eb30/5b6819cf-3143-4288-a2a2-71eb5e8f5ef3/skills/canvas-design/canvas-fonts"
OUT = "/Users/vincentsalomon/locatif-dashboard/canvas-design.png"

W, H = 3200, 2200
BG = (10, 15, 30, 255)

BIENS = [
    {"nom": "T2 Nogent",      "rev": 25303, "col": (14, 165, 233),  "x": 0.49, "y": 0.14},
    {"nom": "Villa Amaryllis","rev": 38001, "col": (16, 185, 129),  "x": 0.63, "y": 0.74},
    {"nom": "Villa Iguana",   "rev": 24600, "col": (99, 102, 241),  "x": 0.72, "y": 0.60},
    {"nom": "Geko",           "rev": 20022, "col": (245, 158, 11),  "x": 0.56, "y": 0.67},
    {"nom": "Zandoli",        "rev": 32080, "col": (59, 130, 246),  "x": 0.47, "y": 0.80},
    {"nom": "Mabouya",        "rev": 8450,  "col": (236, 72, 153),  "x": 0.37, "y": 0.69},
    {"nom": "T2 Schoelcher",  "rev": 12680, "col": (139, 92, 246),  "x": 0.28, "y": 0.59},
]
MAX_REV = max(b["rev"] for b in BIENS)
TOTAL   = sum(b["rev"] for b in BIENS)

def pt(b): return (int(b["x"] * W), int(b["y"] * H))

# ── Bezier ──────────────────────────────────────────────────────────
def bezier_pts(p1, ctrl, p2, steps=60):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        x = (1-t)**2*p1[0] + 2*(1-t)*t*ctrl[0] + t**2*p2[0]
        y = (1-t)**2*p1[1] + 2*(1-t)*t*ctrl[1] + t**2*p2[1]
        pts.append((int(x), int(y)))
    return pts

def ctrl(p1, p2, bend=0.18):
    mx, my = (p1[0]+p2[0])//2, (p1[1]+p2[1])//2
    dx, dy = p2[0]-p1[0], p2[1]-p1[1]
    dist = math.hypot(dx, dy)
    if dist < 1: return (mx, my)
    nx, ny = -dy/dist, dx/dist
    off = dist * bend
    return (int(mx + nx*off), int(my + ny*off))

# ── Build image ──────────────────────────────────────────────────────
base = Image.new("RGBA", (W, H), BG)
draw = ImageDraw.Draw(base)

# Subtle dot grid
for gx in range(0, W, 120):
    for gy in range(0, H, 120):
        draw.ellipse([(gx-1, gy-1), (gx+1, gy+1)], fill=(255, 255, 255, 18))

# Thin coordinate lines (very faint)
for gx in range(0, W, 400):
    draw.line([(gx, 0), (gx, H)], fill=(255, 255, 255, 6), width=1)
for gy in range(0, H, 400):
    draw.line([(0, gy), (W, gy)], fill=(255, 255, 255, 6), width=1)

# ── Glow layers ─────────────────────────────────────────────────────
for b in BIENS:
    x, y = pt(b)
    r = int(40 + (b["rev"] / MAX_REV) * 160)
    c = b["col"]

    # Outer aura — soft blob
    aura = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ad = ImageDraw.Draw(aura)
    ar = r + 100
    ad.ellipse([(x-ar, y-ar), (x+ar, y+ar)], fill=(*c, 55))
    aura = aura.filter(ImageFilter.GaussianBlur(radius=60))
    base = Image.alpha_composite(base, aura)

    # Mid glow
    mid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    md = ImageDraw.Draw(mid)
    md.ellipse([(x-r, y-r), (x+r, y+r)], fill=(*c, 90))
    mid = mid.filter(ImageFilter.GaussianBlur(radius=28))
    base = Image.alpha_composite(base, mid)

draw = ImageDraw.Draw(base)

# ── Arc connections ──────────────────────────────────────────────────
for i in range(len(BIENS)):
    for j in range(i+1, len(BIENS)):
        p1, p2 = pt(BIENS[i]), pt(BIENS[j])
        c1, c2 = BIENS[i]["col"], BIENS[j]["col"]
        avg = tuple((c1[k]+c2[k])//2 for k in range(3))
        cp = ctrl(p1, p2)
        pts = bezier_pts(p1, cp, p2, steps=80)
        # Gradient along arc
        n = len(pts) - 1
        for k in range(n):
            t = k / n
            alpha = int(12 + 18 * math.sin(math.pi * t))
            draw.line([pts[k], pts[k+1]], fill=(*avg, alpha), width=1)

# ── Rings + cores ────────────────────────────────────────────────────
for b in BIENS:
    x, y = pt(b)
    r = int(40 + (b["rev"] / MAX_REV) * 160)
    c = b["col"]
    # Revenue ring (crisp)
    draw.ellipse([(x-r, y-r), (x+r, y+r)], outline=(*c, 220), width=2)
    # Second thin ring (tighter)
    r2 = int(r * 0.62)
    draw.ellipse([(x-r2, y-r2), (x+r2, y+r2)], outline=(*c, 80), width=1)
    # Core
    draw.ellipse([(x-12, y-12), (x+12, y+12)], fill=(*c, 255))
    draw.ellipse([(x-5, y-5),   (x+5, y+5)],   fill=(255, 255, 255, 240))

# ── Load fonts ───────────────────────────────────────────────────────
def F(name, size): return ImageFont.truetype(os.path.join(FONTS, name), size)

fMono     = F("GeistMono-Regular.ttf", 32)
fMonoB    = F("GeistMono-Bold.ttf", 42)
fLabel    = F("InstrumentSans-Regular.ttf", 34)
fLabelB   = F("InstrumentSans-Bold.ttf", 38)
fTitle    = F("CrimsonPro-Italic.ttf", 110)
fSub      = F("Jura-Light.ttf", 32)
fSubM     = F("Jura-Medium.ttf", 28)

def tw(text, font):
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0]

# ── Node labels ───────────────────────────────────────────────────────
for b in BIENS:
    x, y = pt(b)
    r = int(40 + (b["rev"] / MAX_REV) * 160)
    c = b["col"]

    name = b["nom"].upper()
    w_name = tw(name, fLabelB)
    draw.text((x - w_name//2, y - r - 56), name, font=fLabelB, fill=(*c, 210))

    rev_s = f"{b['rev']:,}".replace(",", " ") + " €"
    w_rev = tw(rev_s, fMono)
    draw.text((x - w_rev//2, y + r + 16), rev_s, font=fMono, fill=(200, 210, 225, 170))

# ── Title ─────────────────────────────────────────────────────────────
draw.text((110, 85), "Cartographie de Flux", font=fTitle, fill=(240, 245, 255, 230))

# Thin rule under title
title_w = tw("Cartographie de Flux", fTitle)
draw.line([(110, 210), (110 + title_w, 210)], fill=(255, 255, 255, 30), width=1)

draw.text((114, 228), "7 TERRITOIRES  ·  FRANCE & MARTINIQUE  ·  2025", font=fSub, fill=(100, 116, 139, 200))

# ── Legend (bottom-left) ──────────────────────────────────────────────
draw.text((110, H - 180), "REVENU ANNUEL", font=fSubM, fill=(71, 85, 105, 200))
for k, label in enumerate(["8 k€", "25 k€", "38 k€"]):
    revs = [8450, 25303, 38001]
    r_eg = int(40 + (revs[k] / MAX_REV) * 160)
    ex = 120 + k * 260
    ey = H - 80
    r_small = r_eg // 5
    draw.ellipse([(ex-r_small, ey-r_small), (ex+r_small, ey+r_small)], outline=(150, 160, 180, 130), width=1)
    draw.text((ex - tw(label, fSubM)//2, ey + r_small + 6), label, font=fSubM, fill=(100, 116, 139, 160))

# ── Total (bottom-right) ──────────────────────────────────────────────
total_s = f"{TOTAL:,}".replace(",", " ") + " €"
w_tot = tw(total_s, fMonoB)
draw.text((W - w_tot - 110, H - 175), total_s, font=fMonoB, fill=(255, 255, 255, 210))

label_tot = "REVENUS TOTAUX · 2025"
w_lt = tw(label_tot, fSubM)
draw.text((W - w_lt - 110, H - 120), label_tot, font=fSubM, fill=(71, 85, 105, 200))

# Thin rule
draw.line([(W - w_tot - 110, H - 188), (W - 110, H - 188)], fill=(255, 255, 255, 20), width=1)

# ── Save ──────────────────────────────────────────────────────────────
final = base.convert("RGB")
final.save(OUT, "PNG", dpi=(300, 300))
print(f"Saved → {OUT}")
