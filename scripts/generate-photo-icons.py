"""
Builds the favicon / app-icon set from the background-removed portrait, so
Google results, browser tabs and home-screen shortcuts show the face instead of
the `>_` mark.

    pip install pillow
    python scripts/generate-photo-icons.py

Crop boxes are in the 512x512 source's pixel space. If the photo changes,
re-tune FACE (tight, for 16-512px "any" icons where only the face needs to
read) and HEAD (looser, for icons that iOS / Android launchers mask).
"""

from PIL import Image, ImageFilter
import os

SRC = "public/images/seemol-chakroborti-without-bg.png"
OUT = "public"

FACE = (106, 12, 426, 332)
HEAD = (46, 0, 486, 440)

# The cut-out carries a faint drop shadow (alpha < ~50) that reads as a grey
# halo on light backgrounds. Alpha below LO is dropped, LO..HI is re-ramped so
# the real anti-aliased edge stays smooth.
LO, HI = 50, 150

# iOS paints transparent pixels black and Android requires maskable icons to
# be opaque, so those two get the site's dark theme colour behind the photo.
BG = (5, 7, 15, 255)


def crop(box, size, sharpen=False, bg=None):
    # Resize in premultiplied alpha so the cut-out edge doesn't pick up a halo.
    img = Image.open(SRC).convert("RGBA").crop(box)
    img.putalpha(img.getchannel("A").point(
        lambda a: 0 if a <= LO else min(255, round((a - LO) * 255 / (HI - LO)))
    ))
    img = img.convert("RGBa")
    img = img.resize((size, size), Image.LANCZOS).convert("RGBA")
    # Tiny sizes lose the eyes and glasses without a little edge recovery.
    if sharpen:
        img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=80, threshold=2))
    if bg:
        solid = Image.new("RGBA", img.size, bg)
        img = Image.alpha_composite(solid, img).convert("RGB")
    return img


crop(FACE, 96, sharpen=True).save(f"{OUT}/favicon-96x96.png", optimize=True)
crop(FACE, 192).save(f"{OUT}/icon-192.png", optimize=True)
crop(FACE, 512).save(f"{OUT}/icon-512.png", optimize=True)
crop(HEAD, 180, bg=BG).save(f"{OUT}/apple-touch-icon.png", optimize=True)
crop(HEAD, 512, bg=BG).save(f"{OUT}/icon-maskable-512.png", optimize=True)
crop(FACE, 256, sharpen=True).save(
    f"{OUT}/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
)

print("written:")
for f in [
    "favicon.ico",
    "favicon-96x96.png",
    "icon-192.png",
    "icon-512.png",
    "icon-maskable-512.png",
    "apple-touch-icon.png",
]:
    print(" ", f, os.path.getsize(f"{OUT}/{f}"), "bytes")
