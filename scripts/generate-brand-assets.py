"""
Generates the wpseemol icon set and social card from the `>_` mark.

Everything is drawn as vector shapes and supersampled 4x before downscaling,
so the chevron stays crisp at 16px where a font glyph would turn to mush.
"""

from PIL import Image, ImageDraw, ImageFont
import os

OUT = "public"
SS = 4  # supersample factor

BRAND_500 = (27, 99, 255)
BRAND_600 = (11, 74, 230)
ACCENT_400 = (67, 228, 255)
INK = (5, 7, 15)
ELEV = (10, 14, 27)
TEXT = (230, 236, 250)
MUTED = (142, 155, 186)

MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
MONO_R = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
SANS_B = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
SANS_M = "/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf"


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def diagonal_gradient(size, c0, c1):
    """Cheap 135deg gradient: build it small, then scale up smoothly."""
    w = h = 64
    grad = Image.new("RGB", (w, h))
    px = grad.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = lerp(c0, c1, (x + y) / (w + h - 2))
    return grad.resize(size, Image.BICUBIC)


def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius, fill=255)
    return m


def draw_mark(draw, box, color, weight=0.085):
    """The `>_` mark inside a unit box: chevron plus caret bar."""
    x0, y0, side = box
    u = lambda v: v * side  # noqa: E731

    w = max(int(u(weight)), 1)
    r = w / 2

    pts = [
        (x0 + u(0.30), y0 + u(0.30)),
        (x0 + u(0.545), y0 + u(0.50)),
        (x0 + u(0.30), y0 + u(0.70)),
    ]
    draw.line(pts, fill=color, width=w, joint="curve")
    # Round the caps by hand — PIL only rounds the joints.
    for p in (pts[0], pts[2]):
        draw.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=color)

    # The bar sits level with the chevron's lower tip so the pair reads as
    # `>_` and not `>-`.
    draw.rounded_rectangle(
        [x0 + u(0.605), y0 + u(0.70) - w / 2, x0 + u(0.845), y0 + u(0.70) + w / 2],
        radius=r,
        fill=color,
    )


def make_icon(size, padding=0.0, radius_ratio=0.225, bg=True):
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))

    if bg:
        grad = diagonal_gradient((s, s), BRAND_600, ACCENT_400).convert("RGBA")
        # Keep the tile mostly brand blue; the cyan is a corner highlight only.
        solid = Image.new("RGBA", (s, s), BRAND_500 + (255,))
        grad = Image.blend(grad, solid, 0.45)
        pad = int(s * padding)
        inner = s - pad * 2
        tile = grad.crop((0, 0, inner, inner))
        tile.putalpha(rounded_mask((inner, inner), int(inner * radius_ratio)))
        img.paste(tile, (pad, pad), tile)

    d = ImageDraw.Draw(img)
    pad = int(s * padding)
    draw_mark(d, (pad, pad, s - pad * 2), (255, 255, 255, 255))

    return img.resize((size, size), Image.LANCZOS)


def make_og():
    w, h = 1200 * 2, 630 * 2
    img = Image.new("RGB", (w, h), INK)
    d = ImageDraw.Draw(img, "RGBA")

    # Blueprint grid, fading out toward the bottom right.
    step = 64 * 2
    for x in range(0, w, step):
        d.line([(x, 0), (x, h)], fill=BRAND_500 + (26,), width=2)
    for y in range(0, h, step):
        d.line([(0, y), (w, y)], fill=BRAND_500 + (26,), width=2)

    # Corner glow.
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(60, 0, -1):
        r = i * 26
        gd.ellipse([-r + 200, -r + 120, r + 200, r + 120], fill=BRAND_500 + (3,))
    img.paste(Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB"), (0, 0))

    d = ImageDraw.Draw(img, "RGBA")

    m = 96 * 2
    # ---- logo lockup
    mark_side = 92 * 2
    draw_mark(d, (m, m + 16, mark_side), (133, 166, 255), weight=0.095)

    f_logo = ImageFont.truetype(MONO, 64 * 2)
    d.text((m + mark_side * 0.88, m + mark_side * 0.14), "wpseemol", font=f_logo, fill=TEXT)

    # ---- name
    f_name = ImageFont.truetype(SANS_B, 76 * 2)
    d.text((m, m + 150 * 2), "Seemol Chakroborti", font=f_name, fill=TEXT)

    f_role = ImageFont.truetype(SANS_M, 40 * 2)
    d.text((m, m + 252 * 2), "Full-Stack Web Developer", font=f_role, fill=(133, 166, 255))

    # ---- stack line
    f_stack = ImageFont.truetype(MONO_R, 30 * 2)
    d.text(
        (m, m + 322 * 2),
        "Next.js  ·  React  ·  Laravel  ·  MERN  ·  Shopify",
        font=f_stack,
        fill=MUTED,
    )

    # ---- footer rule + url
    ry = h - m - 40 * 2
    d.line([(m, ry), (w - m, ry)], fill=(255, 255, 255, 28), width=2)
    f_url = ImageFont.truetype(MONO_R, 28 * 2)
    d.text((m, ry + 22 * 2), "wpseemol.site", font=f_url, fill=MUTED)

    right = "Open for freelance & full-time"
    tw = d.textlength(right, font=f_url)
    d.text((w - m - tw, ry + 22 * 2), right, font=f_url, fill=(61, 220, 151))

    # Accent bar down the left edge.
    bar = diagonal_gradient((12 * 2, h), BRAND_500, ACCENT_400)
    img.paste(bar, (0, 0))

    return img.resize((1200, 630), Image.LANCZOS)


os.makedirs(f"{OUT}/images", exist_ok=True)

make_icon(96).save(f"{OUT}/favicon-96x96.png")
make_icon(192).save(f"{OUT}/icon-192.png")
make_icon(512).save(f"{OUT}/icon-512.png")
make_icon(180).save(f"{OUT}/apple-touch-icon.png")
# Maskable icons get cropped to a circle by some launchers, so the mark sits
# inside the 80% safe zone with the tile bled to the edges.
make_icon(512, padding=0.0, radius_ratio=0.0).resize((512, 512), Image.LANCZOS)
maskable = Image.new("RGBA", (512, 512), BRAND_500 + (255,))
md = ImageDraw.Draw(maskable)
draw_mark(md, (512 * 0.15, 512 * 0.15, 512 * 0.70), (255, 255, 255, 255), weight=0.1)
maskable.save(f"{OUT}/icon-maskable-512.png")

ico = make_icon(64)
ico.save(f"{OUT}/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

make_og().save(f"{OUT}/images/og-seemol-chakroborti.png", optimize=True)

print("written:")
for f in [
    "favicon.ico",
    "favicon-96x96.png",
    "icon-192.png",
    "icon-512.png",
    "icon-maskable-512.png",
    "apple-touch-icon.png",
    "images/og-seemol-chakroborti.png",
]:
    print(" ", f, os.path.getsize(f"{OUT}/{f}"), "bytes")
