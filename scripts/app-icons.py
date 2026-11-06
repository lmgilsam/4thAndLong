# Builds the app icons and tab icon from Leo's football art (black background).
import sys
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
BG = (2, 2, 2)
CX, CY = 1297.5, 693.5  # center of the ball in the source image

def square(side):
    """A side x side canvas centered on the ball, padded with the background color."""
    c = Image.new('RGB', (side, side), BG)
    c.paste(im, (int(round(side / 2 - CX)), int(round(side / 2 - CY))))
    return c

def save(img, size, name, rounded=False):
    s = img.resize((size, size), Image.LANCZOS)
    if size <= 64:
        s = s.filter(ImageFilter.UnsharpMask(radius=0.6, percent=60, threshold=2))
    if rounded:  # browser tab icon: rounded dark tile with a transparent outside
        m = Image.new('L', (size * 4, size * 4), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, size * 4 - 1, size * 4 - 1], radius=int(size * 4 * 0.19), fill=255)
        s = s.convert('RGBA'); s.putalpha(m.resize((size, size), Image.LANCZOS))
    s.save(f'{out}/{name}', optimize=True)

app = square(1420)        # ball fills ~78% of the icon (iPhone, Android "any")
safe = square(1760)       # ball inside the 80% circle Android may crop to (maskable)
tab = square(1180)        # tighter, so the ball reads at 16-32px in a browser tab
save(app, 512, 'icons/icon-512.png'); save(app, 192, 'icons/icon-192.png'); save(app, 180, 'apple-touch-icon.png')
save(safe, 512, 'icons/icon-maskable-512.png')
save(tab, 64, 'favicon-64.png', rounded=True); save(tab, 32, 'favicon-32.png', rounded=True)
