# The "4TH & / ball / LONG" badge on a top-down field: the home screen app icon and the Instagram profile picture.
# Used by app-icons.py. Run on its own to write the 1080x1080 profile picture:
#   python3 scripts/brand_icon.py scripts/art/football.jpg out.png
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONT = os.path.join(os.path.dirname(__file__), '..', 'public', 'og', 'big-shoulders-display-latin-900-normal.woff')
TURF_A, TURF_B = (0x1d, 0x6b, 0x3a), (0x19, 0x5f, 0x33)   # --turf-a / --turf-b
CHALK, AMBER = (0xf2, 0xef, 0xe4), (0xff, 0xb6, 0x27)      # --chalk / --amber
GREEN_SH = [(0x0a, 0x26, 0x15), (0x0f, 0x3a, 0x20)]        # .game-title stacked shadow
AMBER_SH = [(0x4d, 0x32, 0x00)] * 2


def cut_ball(src):
    """The ball from Leo's art, with its black background made transparent, cropped tight."""
    im = Image.open(src).convert('RGB')
    fg = im.convert('L').point(lambda v: 255 if v > 10 else 0).filter(ImageFilter.MedianFilter(9))
    ImageDraw.floodfill(fg, (0, 0), 128)                   # the background is everything reachable from a corner
    mask = fg.point(lambda v: 0 if v == 128 else 255)
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    ball = im.convert('RGBA'); ball.putalpha(mask)
    return ball.crop(mask.point(lambda v: 255 if v > 128 else 0).getbbox())


def render(src, size=1080, content=1.0):
    """Draws the badge at 1080 and scales to `size`. `content` shrinks the ball and text (not the field) for safe zones."""
    S = 1080
    k = content
    f = Image.new('RGB', (S, S), TURF_A); d = ImageDraw.Draw(f)
    band = S / 6
    for i in range(7):                                     # 5-yard bands, alternating mow stripes
        if i % 2: d.rectangle([0, i * band, S, (i + 1) * band], fill=TURF_B)
    for i in range(7):                                     # yard lines
        y = round(i * band); d.rectangle([0, y - 4, S, y + 4], fill=CHALK)
    for i in range(6):                                     # hash marks and sideline ticks
        for j in range(1, 5):
            y = round(i * band + j * band / 5)
            for x in (330, 750): d.rectangle([x - 14, y - 3, x + 14, y + 3], fill=CHALK)
            d.rectangle([0, y - 3, 34, y + 3], fill=CHALK); d.rectangle([S - 34, y - 3, S, y + 3], fill=CHALK)
    v = Image.new('L', (S, S), 0); ImageDraw.Draw(v).ellipse([-120, -120, S + 120, S + 120], fill=255)
    f = Image.composite(f, Image.new('RGB', (S, S), (6, 22, 12)), v.filter(ImageFilter.GaussianBlur(140))).convert('RGBA')

    ball = cut_ball(src)
    bw = round(560 * k); bh = round(ball.height * bw / ball.width)
    ball = ball.resize((bw, bh), Image.LANCZOS)
    bx, by = (S - bw) // 2, (S - bh) // 2 + round(4 * k)
    sh = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    sh.paste((0, 0, 0, 170), (bx + round(10 * k), by + round(22 * k)), ball.split()[3])
    f = Image.alpha_composite(f, sh.filter(ImageFilter.GaussianBlur(16 * k)))
    f.alpha_composite(ball, (bx, by))

    def word(parts, cy):
        """One line of title text centered at height cy; shorter glyphs (the &) are centered on the tallest."""
        fonts = [ImageFont.truetype(FONT, round(s * k)) for _, s, _, _ in parts]
        boxes = [fo.getbbox(t, anchor='ls') for (t, *_), fo in zip(parts, fonts)]
        gap = 22 * k
        total = sum(b[2] - b[0] for b in boxes) + gap * (len(parts) - 1)
        tall = max(b[3] - b[1] for b in boxes)
        x = (S - total) / 2
        base = S / 2 + (cy - S / 2) * k + tall / 2
        glow = Image.new('RGBA', (S, S), (0, 0, 0, 0)); layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        for (t, _, col, shadows), fo, b in zip(parts, fonts, boxes):
            ox = x - b[0]
            yb = base - (tall - (b[3] - b[1])) / 2 - b[3]
            ImageDraw.Draw(glow).text((ox, yb), t, font=fo, fill=(0, 0, 0, 200), anchor='ls')
            for i, sc in enumerate(shadows):
                ImageDraw.Draw(layer).text((ox, yb + 7 * k * (len(shadows) - i)), t, font=fo, fill=sc, anchor='ls')
            ImageDraw.Draw(layer).text((ox, yb), t, font=fo, fill=col, anchor='ls')
            x += b[2] - b[0] + gap
        return glow.filter(ImageFilter.GaussianBlur(22 * k)), layer

    for g, l in (word([('4TH', 210, CHALK, GREEN_SH), ('&', 160, AMBER, AMBER_SH)], 165),
                 word([('LONG', 210, CHALK, GREEN_SH)], 905)):
        f = Image.alpha_composite(Image.alpha_composite(Image.alpha_composite(f, g), g), l)
    f = f.convert('RGB')
    return f if size == S else f.resize((size, size), Image.LANCZOS)


if __name__ == '__main__':
    render(sys.argv[1]).save(sys.argv[2], optimize=True)
