import sys, os
from PIL import Image, ImageDraw
d, saida, cols, sz = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]); ini, fim = int(sys.argv[5]), int(sys.argv[6])
fs = sorted(f for f in os.listdir(d) if f.endswith('.webp'))[ini:fim]
rows = (len(fs) + cols - 1) // cols; W = cols * sz; H = rows * (sz + 14)
S = Image.new('RGB', (W, H), (70, 90, 60)); dr = ImageDraw.Draw(S)
for k, f in enumerate(fs):
    im = Image.open(f'{d}/{f}').convert('RGBA').resize((sz, sz), Image.LANCZOS); x, y = (k % cols) * sz, (k // cols) * (sz + 14)
    S.paste(im, (x, y), im); dr.text((x + 2, y + sz), f[:-5][:int(sz / 5.2)], fill=(255, 255, 255))
S.save(saida)
print(len(fs))
