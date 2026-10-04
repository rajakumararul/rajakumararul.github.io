"""
Generates clearly labelled PLACEHOLDER images for gallery albums.
Used only until real photographs are supplied. Run:  python3 scripts/gallery/make-placeholders.py
"""
import math, random, pathlib
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parents[2] / 'src/content/gallery'
SERIF = '/System/Library/Fonts/Supplemental/Georgia.ttf'
SANS = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
MONO = '/System/Library/Fonts/Menlo.ttc'

def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', size)

ALBUMS = {
    'vit-five-years-service-award': ('Five Years of Service Award', (79, 59, 209), 1),
    'qiskit-global-summer-school-2026': ('Qiskit Global Summer School 2026', (11, 138, 163), 2),
    'hod-department-of-quantum-computing': ('Department of Quantum Computing', (58, 40, 173), 1),
    'latex-keynote-national-library-week-2025': ('58th National Library Week — Keynote', (30, 90, 160), 4),
    'fdp-qkd-pqc-session-2025': ('FDP Session — QKD & Post-Quantum Cryptography', (90, 60, 190), 2),
    'mitacs-globalink-algoma-2025': ('Mitacs Globalink Research, Canada', (20, 120, 140), 2),
    'vimarsh-5g-hackathon': ('VIMARSH 5G Hackathon — Winning Team', (100, 70, 200), 1),
    'samsung-prism-worklet': ('Samsung PRISM Worklet', (40, 100, 170), 1),
}

W, H = 1600, 1067

def make(path, title, accent, n, total, seed):
    random.seed(seed)
    img = Image.new('RGB', (W, H), (13, 21, 38))
    d = ImageDraw.Draw(img)
    # gradient wash
    for y in range(H):
        t = y / H
        r = int(13 + (accent[0] - 13) * 0.35 * (1 - t))
        g = int(21 + (accent[1] - 21) * 0.35 * (1 - t))
        b = int(38 + (accent[2] - 38) * 0.35 * (1 - t))
        d.line([(0, y), (W, y)], fill=(r, g, b))
    # lattice
    pts = []
    gap = 110
    for row in range(-1, H // gap + 2):
        for col in range(-1, W // gap + 2):
            x = col * gap + (row % 2) * gap / 2 + random.uniform(-25, 25)
            y = row * gap * 0.86 + random.uniform(-25, 25)
            pts.append((x, y))
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    for i, a in enumerate(pts):
        for b in pts[i + 1:]:
            if math.dist(a, b) < gap * 1.2 and random.random() > 0.4:
                ld.line([a, b], fill=(*accent, 70), width=1)
        ld.ellipse([a[0] - 3, a[1] - 3, a[0] + 3, a[1] + 3], fill=(*accent, 150))
    img.paste(layer, (0, 0), layer)
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([W * 0.55, -H * 0.3, W * 1.2, H * 0.6], fill=(*accent, 90))
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    img.paste(glow, (0, 0), glow)

    d = ImageDraw.Draw(img)
    # label
    # Label sits in the middle so it never hides behind card badges.
    d.rounded_rectangle([80, H - 450, 520, H - 380], radius=35, outline=(243, 196, 107), width=3)
    d.text((112, H - 432), 'PLACEHOLDER IMAGE', font=font(SANS, 30), fill=(243, 196, 107))
    d.text((80, H - 330), title, font=font(SERIF, 64), fill=(242, 241, 236))
    d.text((80, H - 230), 'Replace with the actual event photograph', font=font(SERIF, 38), fill=(200, 205, 220))
    d.text((80, H - 140), f'Sample photo {n} of {total}', font=font(MONO, 28), fill=(160, 170, 195))
    img.save(path, 'JPEG', quality=82, optimize=True, progressive=True)

for slug, (title, accent, count) in ALBUMS.items():
    folder = ROOT / slug
    folder.mkdir(parents=True, exist_ok=True)
    for i in range(1, count + 1):
        name = 'placeholder-cover.jpg' if i == 1 else f'placeholder-{i:02d}.jpg'
        make(folder / name, title, accent, i, count, hash(slug) + i)
    print('✓', slug, count)
