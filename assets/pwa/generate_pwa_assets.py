#!/usr/bin/env python3
"""
Генератор PWA-ассетов Hostera (иконки + iOS splash-screens) из токенов бренда
Titanium & Cognac. Запуск:  python3 generate_pwa_assets.py
Все PNG кладутся рядом со скриптом (assets/pwa/).

Шрифт: по умолчанию берётся системный serif (Liberation/DejaVu). Чтобы получить
100% брендовый вид — положите Fraunces рядом (Fraunces.ttf) и задайте SERIF_PATH.
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))

# ── Токены бренда Titanium & Cognac ─────────────────────────────────────────
LIGHT_BG   = "#F5F5F7"
LIGHT_TEXT = "#1C1C1E"
LIGHT_MUTED= "#6E6E73"
DARK_BG    = "#1C1C1E"
DARK_TEXT  = "#F5F5F7"
DARK_MUTED = "#8E8E93"
COGNAC     = "#C76B28"   # акцент светлой темы
COGNAC_SOFT= "#D9883F"   # акцент тёмной темы
# Иконка: тёмный «титан» + коньячный вензель — читается на любом хоум-скрине
ICON_BG    = "#1C1C1E"
ICON_MARK  = "#C76B28"

# ── Поиск serif-шрифта ──────────────────────────────────────────────────────
SERIF_CANDIDATES = [
    os.path.join(HERE, "Fraunces.ttf"),
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
]
SERIF_BOLD_CANDIDATES = [
    os.path.join(HERE, "Fraunces-SemiBold.ttf"),
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSerif-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
]

def _first(paths):
    for p in paths:
        if os.path.exists(p):
            return p
    raise SystemExit("Не найден serif-шрифт: " + ", ".join(paths))

SERIF_PATH = _first(SERIF_CANDIDATES)
SERIF_BOLD_PATH = _first(SERIF_BOLD_CANDIDATES)

def font(size, bold=False):
    return ImageFont.truetype(SERIF_BOLD_PATH if bold else SERIF_PATH, size)

def draw_tracked(draw, xy, text, fnt, fill, tracking=0, anchor_center=True):
    """Рисует текст с межбуквенным трекингом, центрируя по xy (если anchor_center)."""
    widths = []
    for ch in text:
        bb = draw.textbbox((0, 0), ch, font=fnt)
        widths.append(bb[2] - bb[0])
    total = sum(widths) + tracking * (len(text) - 1)
    x = xy[0] - total / 2 if anchor_center else xy[0]
    ascent, descent = fnt.getmetrics()
    y = xy[1] - (ascent + descent) / 2
    for ch, w in zip(text, widths):
        bb = draw.textbbox((0, 0), ch, font=fnt)
        draw.text((x - bb[0], y), ch, font=fnt, fill=fill)
        x += w + tracking

# ── Иконки ──────────────────────────────────────────────────────────────────
def make_icon(size, mark_scale=0.52, out="icon.png"):
    """Квадратная непрозрачная иконка: титановый фон + коньячный вензель H."""
    img = Image.new("RGB", (size, size), ICON_BG)
    d = ImageDraw.Draw(img)
    f = font(int(size * mark_scale), bold=True)
    draw_tracked(d, (size/2, size*0.50), "H", f, ICON_MARK, tracking=0)
    # тонкая коньячная черта-подпись под вензелем
    lw = int(size * 0.16); ly = int(size * 0.72); th = max(2, int(size*0.012))
    d.rectangle([size/2 - lw/2, ly, size/2 + lw/2, ly + th], fill=ICON_MARK)
    img.save(os.path.join(HERE, out))
    return out

def make_maskable(size, out="icon-maskable.png"):
    # маскируемая: вензель в пределах центральных ~55% (safe zone для круговой маски)
    return make_icon(size, mark_scale=0.40, out=out)

# ── Splash ──────────────────────────────────────────────────────────────────
def make_splash(w, h, dark, out):
    bg   = DARK_BG if dark else LIGHT_BG
    text = DARK_TEXT if dark else LIGHT_TEXT
    muted= DARK_MUTED if dark else LIGHT_MUTED
    accent = COGNAC_SOFT if dark else COGNAC
    img = Image.new("RGB", (w, h), bg)
    d = ImageDraw.Draw(img)
    cx, cy = w/2, h/2
    # вордмарк
    wm = font(int(w * 0.11))
    draw_tracked(d, (cx, cy - h*0.02), "HOSTERA", wm, text, tracking=int(w*0.022))
    # коньячная разделительная черта
    lw = int(w * 0.14); th = max(2, int(w*0.006)); ly = int(cy + h*0.035)
    d.rectangle([cx - lw/2, ly, cx + lw/2, ly + th], fill=accent)
    # подзаголовок
    sub = font(int(w * 0.032))
    draw_tracked(d, (cx, cy + h*0.075), "a new era of hospitality", sub, muted, tracking=int(w*0.006))
    img.save(os.path.join(HERE, out))
    return out

# Портретные разрешения iPhone 14–17 (+ Air), @3x — px = points × 3
SPLASH_SIZES = [
    (1170, 2532),  # 390×844  — iPhone 14
    (1179, 2556),  # 393×852  — 16 / 15 / 15 Pro / 14 Pro
    (1206, 2622),  # 402×874  — 17 / 17 Pro / 16 Pro
    (1260, 2736),  # 420×912  — iPhone Air
    (1284, 2778),  # 428×926  — 14 Plus
    (1290, 2796),  # 430×932  — 16 Plus / 15 Pro Max / 15 Plus / 14 Pro Max
    (1320, 2868),  # 440×956  — 17 Pro Max / 16 Pro Max
]

def main():
    make_icon(192, out="icon-192.png")
    make_icon(512, out="icon-512.png")
    make_maskable(512, out="icon-512-maskable.png")
    make_icon(180, out="apple-touch-icon-180.png")  # непрозрачная, для iOS
    n = 4
    for (w, h) in SPLASH_SIZES:
        make_splash(w, h, dark=False, out=f"splash-{w}x{h}-light.png")
        make_splash(w, h, dark=True,  out=f"splash-{w}x{h}-dark.png")
        n += 2
    print(f"Готово: {n} PNG. Serif: {os.path.basename(SERIF_PATH)}")

if __name__ == "__main__":
    main()
