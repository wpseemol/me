"""
Builds the favicon / app-icon set from the portrait, so Google results, browser
tabs and home-screen shortcuts show the face instead of the `>_` mark.

    pip install pillow
    python scripts/generate-photo-icons.py

Crop boxes are in the 1200x1200 source's pixel space. If the photo changes,
re-tune FACE (tight, for 16-96px where only the face reads) and HEAD (looser,
for large icons that launchers may mask to a circle).
"""

from PIL import Image, ImageFilter
import os

SRC = "public/images/seemol-chakroborti.jpg"
OUT = "public"

FACE = (247, 95, 967, 815)
HEAD = (157, 30, 1057, 930)


def square(box, size, sharpen=False):
    img = Image.open(SRC).convert("RGB").crop(box).resize((size, size), Image.LANCZOS)
    # Tiny sizes lose the eyes and glasses without a little edge recovery.
    if sharpen:
        img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=80, threshold=2))
    return img


square(FACE, 96, sharpen=True).save(f"{OUT}/favicon-96x96.png", optimize=True)
square(FACE, 192).save(f"{OUT}/icon-192.png", optimize=True)
square(FACE, 512).save(f"{OUT}/icon-512.png", optimize=True)
square(HEAD, 180).save(f"{OUT}/apple-touch-icon.png", optimize=True)
square(HEAD, 512).save(f"{OUT}/icon-maskable-512.png", optimize=True)
square(FACE, 256, sharpen=True).save(
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
